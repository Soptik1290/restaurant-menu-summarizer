// server/src/menu/menu.service.ts

import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

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

  // Constructor without CacheManager
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache // <-- ADD THIS
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async summarize(url: string) {
    this.logger.log(`Starting summarization for URL: ${url}`);

    const today = new Date().toISOString().split('T')[0];

  // 1. Define a unique cache key for this URL and date
    // e.g., "menu:2025-10-24:https://..."
    const cacheKey = `menu:${today}:${url}`; 

    try {
      // 2. Try to get data from the cache first
      const cachedMenu = await this.cacheManager.get(cacheKey);

      // If data is found in cache (CACHE HIT)
      if (cachedMenu) {
        this.logger.log(`CACHE HIT: Returning menu from cache for key: ${cacheKey}`); // Return cached data immediately, skip LLM call [cite: 66]
        return cachedMenu; 
      }

      // 3. If no data in cache (CACHE MISS), proceed with fetching
      this.logger.log(`CACHE MISS: Fetching menu from source for key: ${cacheKey}`);

      // === ALL THE LOGIC YOU ALREADY BUILT ===

      // Fetch HTML content
      const htmlContent = await this.fetchHtmlContent(url);

      // Clean HTML to plain text
      const $ = cheerio.load(htmlContent);
      const textContent = $('body').text();
      this.logger.log('HTML content has been cleaned to plain text.');

      // Prepare OpenAI call
      const dayOfWeek = new Date().toLocaleDateString('cs-CZ', { weekday: 'long' });
      const dayOfWeekUpper = dayOfWeek.toUpperCase(); 

      // !!! IMPORTANT !!!
      // Paste your final, working systemPrompt here
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
        model: 'gpt-5-mini', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the CLEANED TEXT content from the restaurant website: ${textContent.substring(0, 20000)}` },
        ],
        tools: [this.menuTool],
        tool_choice: { type: 'function', function: { name: 'save_menu_json' } },
      });

      // Parse response
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

        // 4. Save the final result to the cache before returning
        await this.cacheManager.set(cacheKey, finalResult); 
        this.logger.log(`CACHE SET: Saved menu to cache for key: ${cacheKey}`);

        return finalResult;

      } else {
        this.logger.warn('AI did not call the expected "save_menu_json" tool.');
        throw new Error('AI did not return the expected menu data.');
      }

    } catch (error) {
      // If any error happens, delete the cache key to avoid caching bad data
      await this.cacheManager.del(cacheKey); 
      this.logger.error(`Failed during summarize, cache cleared. Error: ${error.message}`);
      throw new HttpException(
        `Processing failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Helper function to fetch HTML content
   */
  private async fetchHtmlContent(url: string): Promise<string> {
    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };
      const response = await axios.get(url, { headers });
      this.logger.log(`Successfully fetched content from ${url}. Length: ${response.data.length} chars.`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch content from ${url}: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve content from URL: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}