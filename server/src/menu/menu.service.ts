import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

/**
 * Result type for content fetching operations
 */
type FetchResult = {
  data: string;
  contentType: string;
};

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);
  private openai: OpenAI;

  /**
   * OpenAI function tool definition for structured menu extraction
   * Forces AI to return data in specific JSON format
   */
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

  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache 
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Main method to extract and summarize restaurant menu from URL
   * Supports HTML, images (OCR), and PDF content with caching
   */
  async summarize(url: string) {
    this.logger.log(`Starting summarization for URL: ${url}`);

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `menu:${today}:${url}`; 

    try {
      // Check cache first
      const cachedMenu = await this.cacheManager.get(cacheKey);
      if (cachedMenu) {
        this.logger.log(`CACHE HIT: Returning menu from cache for key: ${cacheKey}`);
        return cachedMenu; 
      }

      this.logger.log(`CACHE MISS: Fetching menu from source for key: ${cacheKey}`);

      // Fetch and process content based on type
      const content = await this.fetchContent(url);
      let textContent: string;

      this.logger.log(`Content-Type detected: ${content.contentType}`);
      
      if (content.contentType.includes('text/html')) {
        // Process HTML content with Cheerio
        this.logger.log('Processing as HTML with Cheerio...');
        const $ = cheerio.load(content.data);
        textContent = $('body').text();
        this.logger.log('HTML content has been cleaned to plain text.');

      } else if (content.contentType.includes('image/')) {
        // Process image with OCR service
        this.logger.log('Processing as Image with OCR Service...');
        const ocrResponse = await axios.post('http://localhost:8000/ocr', {
          url: url, 
        });
        textContent = ocrResponse.data.text;
        this.logger.log('Successfully received text from OCR service.');
        
      } else if (content.contentType.includes('application/pdf')) {
        // Process PDF with PDF service
        this.logger.log('Processing as PDF with PDF Service...');
        const pdfResponse = await axios.post('http://localhost:8000/pdf', {
          url: url,
        });
        textContent = pdfResponse.data.text;
        this.logger.log('Successfully received text from PDF service.');

      } else {
        this.logger.warn(`Unsupported Content-Type: ${content.contentType}`);
        throw new HttpException(
          `Unsupported content type: ${content.contentType}. Only text/html, image/*, and application/pdf are supported.`,
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
      }
      
      // Process with OpenAI
      const dayOfWeek = new Date().toLocaleDateString('cs-CZ', { weekday: 'long' });
      const dayOfWeekUpper = dayOfWeek.toUpperCase(); 

      const systemPrompt = `Jsi užitečný asistent, který extrahuje jídelní lístky z **obyčejného textu**.
                            Aktuální datum je ${today}. Dnes je ${dayOfWeek} (Česky: ${dayOfWeekUpper}).
                            
                            Tvým úkolem je najít v poskytnutém textu sekci pro **${dayOfWeekUpper}**.
                            Hledej text, který odpovídá "${dayOfWeekUpper}".
                            Jakmile najdeš správnou sekci (např. "PÁTEK"), extrahuj **VŠECHNY** položky menu, které jsou pod ní uvedeny.
                            Menu často obsahuje polévku (např. "GULÁŠOVÁ") uvedenou *před* hlavními jídly. Tuto polévku MUSÍŠ zahrnout s kategorií 'polévka'.
                            Extrahuj všechna jídla pro daný den, nejen to první.
                            
                            Pokud sekci pro ${dayOfWeekUpper} absolutně nemůžeš najít, nastav "daily_menu" na false a "menu_items" na prázdné pole [].
                            Normalizuj ceny na číslo (např. "145 Kč" -> 145).
                            Alergeny by měly být pole textových řetězců (stringů).
                            Nevymýšlej si jídla ani ceny.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the CLEANED TEXT content from the restaurant website: ${textContent.substring(0, 20000)}` },
        ],
        tools: [this.menuTool],
        tool_choice: { type: 'function', function: { name: 'save_menu_json' } },
      });

      // Parse AI response
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

        // Cache the result
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
   * Fetches content from URL and returns both data and content type
   * Used to determine processing method (HTML, OCR, PDF)
   */
  private async fetchContent(url: string): Promise<FetchResult> {
    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };
      
      const response = await axios.get(url, { 
        headers: headers,
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