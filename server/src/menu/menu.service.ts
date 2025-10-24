// server/src/menu/menu.service.ts

import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

// A helper type to define what our fetchContent function returns
type FetchResult = {
  data: string;
  contentType: string;
};

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);
  private openai: OpenAI;

  // This is the JSON structure we force the AI to return
  private readonly menuTool = {
    type: 'function' as const,
    function: {
      name: 'save_menu_json',
      description: 'Saves the extracted daily menu information.',
      parameters: {
        type: 'object' as const,
        properties: {
          restaurant_name: { 
            type: 'string', 
            description: 'The name of the restaurant.' 
          },
          menu_items: {
            type: 'array',
            description: 'List of menu items for the day.',
            items: {
              type: 'object',
              properties: {
                category: { 
                  type: 'string', 
                  description: 'Category (e.g., "polévka", "hlavní jidlo", "dezert").' 
                },
                name: { 
                  type: 'string', 
                  description: 'Name of the dish.' 
                },
                price: { 
                  type: 'number', 
                  description: 'Price of the dish as a number (e.g., 145).' 
                },
                allergens: {
                  type: 'array',
                  description: 'List of allergen numbers as strings.',
                  items: { type: 'string' },
                },
                weight: {
                  type: 'string',
                  description: 'Weight of the dish (e.g., "150g"). Optional.',
                  nullable: true,
                }
              },
              required: ['category', 'name', 'price'],
            },
          },
          daily_menu: {
            type: 'boolean',
            description: 'True if a daily menu was found, false otherwise.'
          }
        },
        required: ['restaurant_name', 'menu_items', 'daily_menu'],
      },
    },
  };

  // Constructor with CacheManager injection
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache 
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async summarize(url: string) {
    this.logger.log(`Starting summarization for URL: ${url}`);

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `menu:${today}:${url}`; 

    try {
      // 1. Try to get data from the cache first
      const cachedMenu = await this.cacheManager.get(cacheKey);

      if (cachedMenu) {
        this.logger.log(`CACHE HIT: Returning menu from cache for key: ${cacheKey}`);
        return cachedMenu; 
      }

      // 2. If no data in cache (CACHE MISS), proceed with fetching
      this.logger.log(`CACHE MISS: Fetching menu from source for key: ${cacheKey}`);

      // 3. Fetch content and check its type
      const content = await this.fetchContent(url);
      
      let textContent: string;

      // 4. --- FINAL Content-Type Router ---
      this.logger.log(`Content-Type detected: ${content.contentType}`);
      
      if (content.contentType.includes('text/html')) {
        // --- Path A: HTML ---
        this.logger.log('Processing as HTML with Cheerio...');
        const $ = cheerio.load(content.data);
        textContent = $('body').text();
        this.logger.log('HTML content has been cleaned to plain text.');

      } else if (content.contentType.includes('image/')) {
        // --- Path B: Image (Call Python OCR Service) ---
        this.logger.log('Processing as Image with OCR Service...');
        const ocrResponse = await axios.post('http://localhost:8000/ocr', {
          url: url, 
        });
        textContent = ocrResponse.data.text;
        this.logger.log('Successfully received text from OCR service.');
        
      } else if (content.contentType.includes('application/pdf')) {
        // --- !!! THIS IS THE MISSING BLOCK !!! ---
        this.logger.log('Processing as PDF with PDF Service...');
        const pdfResponse = await axios.post('http://localhost:8000/pdf', {
          url: url,
        });
        textContent = pdfResponse.data.text;
        this.logger.log('Successfully received text from PDF service.');

      } else {
        // --- Path D: Unsupported ---
        this.logger.warn(`Unsupported Content-Type: ${content.contentType}`);
        throw new HttpException(
          `Unsupported content type: ${content.contentType}. Only text/html, image/*, and application/pdf are supported.`,
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
      }
      
      // 5. Prepare and Call OpenAI
      const dayOfWeek = new Date().toLocaleDateString('cs-CZ', { weekday: 'long' });
      const dayOfWeekUpper = dayOfWeek.toUpperCase(); 

      // Your working system prompt
      const systemPrompt = `You are a helpful assistant that extracts restaurant menus from **plain text**.
                      The current date is ${today}. Today is ${dayOfWeek} (in Czech: ${dayOfWeekUpper}).
                      Your task is to find the section for **${dayOfWeekUpper}** in the provided text.
                      Look for the text that matches "${dayOfWeekUpper}".
                      Once you find the correct section (e.g., "PÁTEK"), extract **ALL** menu items listed under it.
                      The menu often lists a soup (polévka) for the day *before* the main dishes (e.g., "GULÁŠOVÁ"). You MUST include this soup as a 'polévka' category.
                      Extract all dishes for the day, not just the first one.
                      If you absolutely cannot find a section for ${dayOfWeekUpper}, set daily_menu to false and menu_items to an empty array.
                      Normalize prices to a number (e.g., "145 Kč" -> 145).
                      Allergens should be an array of strings.
                      Do not make up dishes or prices.`;

      // Call OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5-mini', // Your model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the CLEANED TEXT content from the restaurant website: ${textContent.substring(0, 20000)}` },
        ],
        tools: [this.menuTool],
        tool_choice: { type: 'function', function: { name: 'save_menu_json' } },
      });

      // 6. Parse response
      const toolCalls = response.choices[0]?.message?.tool_calls;

      if (toolCalls && toolCalls[0] && toolCalls[0].type === 'function' && toolCalls[0].function.name === 'save_menu_json') {

        this.logger.log('Successfully received structured JSON from AI.');
        const toolCall = toolCalls[0];
        const menuData = JSON.parse(toolCall.function.arguments);

        const finalResult = {
          ...menuData,
          date: today,
          source_url: url,
        };

        // 7. Save to cache
        await this.cacheManager.set(cacheKey, finalResult); 
        this.logger.log(`CACHE SET: Saved menu to cache for key: ${cacheKey}`);

        return finalResult;

      } else {
        this.logger.warn('AI did not call the expected "save_menu_json" tool.');
        throw new Error('AI did not return the expected menu data.');
      }

    } catch (error) {
      await this.cacheManager.del(cacheKey); 
      this.logger.error(`Failed during summarize, cache cleared. Error: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Processing failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Helper function to fetch content AND its Content-Type
   */
  private async fetchContent(url: string): Promise<FetchResult> {
    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };
      
      const response = await axios.get(url, { 
        headers: headers,
        // We set responseType to 'arraybuffer' to handle binary files like PDF
        // and images correctly. Cheerio can handle buffers.
        // **Correction**: Let's stick to the simpler way that worked for HTML/Image
        // Our Python service re-downloads anyway.
        // The default `response.data` will be a string.
      });

      const contentType = response.headers['content-type'] || 'unknown';
      
      this.logger.log(`Successfully fetched content from ${url}. Content-Type: ${contentType}.`);
      
      return {
        data: response.data, 
        contentType: contentType,
      };

    } catch (error) {
      this.logger.error(`Failed to fetch content from ${url}: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve content from URL: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}