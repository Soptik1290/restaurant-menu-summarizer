import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

/**
 * Type definition for content fetching result
 */
type FetchResult = {
  data: string;
  contentType: string;
};

/**
 * Interface for structured API error responses
 * Helps frontend display detailed error information
 */
interface ApiError {
  statusCode: number;
  message: string;
  error?: string; // e.g., "Not Found", "Bad Gateway"
}

/**
 * Service for extracting and summarizing restaurant menus
 * Supports HTML, images (OCR), and PDF content processing
 */
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
   * @param url Restaurant URL for menu extraction
   * @returns Extracted and structured menu data
   */
  async summarize(url: string) {
    this.logger.log(`Starting summarization for URL: ${url}`);
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `menu:${today}:${url}`;

    try {
      const cachedMenu = await this.cacheManager.get(cacheKey);
      if (cachedMenu) {
        this.logger.log(`CACHE HIT: Returning menu from cache for key: ${cacheKey}`);
        return cachedMenu;
      }
      this.logger.log(`CACHE MISS: Fetching menu from source for key: ${cacheKey}`);

      const content = await this.fetchContent(url);
      let textContent: string;

      this.logger.log(`Content-Type detected: ${content.contentType}`);

      if (content.contentType.includes('text/html')) {
        this.logger.log('Processing as HTML with Cheerio...');
        const $ = cheerio.load(content.data);
        textContent = $('body').text();
        if (!textContent || textContent.trim().length < 50) {
          this.logger.warn(`Extracted very little text from HTML for ${url}`);
        }
        this.logger.log('HTML content has been cleaned to plain text.');

      } else if (content.contentType.includes('image/')) {
        this.logger.log('Processing as Image with OCR Service...');
        const ocrResponse = await axios.post('http://localhost:8000/ocr', { url: url }, { timeout: 15000 });
        textContent = ocrResponse.data.text;
        if (!textContent || textContent.trim().length < 10) {
          throw new HttpException('OCR service returned empty or very short text.', HttpStatus.UNPROCESSABLE_ENTITY);
        }
        this.logger.log('Successfully received text from OCR service.');

      } else if (content.contentType.includes('application/pdf')) {
        this.logger.log('Processing as PDF with PDF Service...');
        const pdfResponse = await axios.post('http://localhost:8000/pdf', { url: url }, { timeout: 15000 });
        textContent = pdfResponse.data.text;
        if (!textContent || textContent.trim().length < 10) {
          throw new HttpException('PDF service returned empty or very short text.', HttpStatus.UNPROCESSABLE_ENTITY);
        }
        this.logger.log('Successfully received text from PDF service.');

      } else {
        throw new HttpException(
          `Unsupported content type: ${content.contentType}. Only text/html, image/*, and application/pdf are supported.`,
          HttpStatus.UNSUPPORTED_MEDIA_TYPE
        );
      }

      this.logger.log('Sending extracted text to OpenAI...');
      const dayOfWeek = new Date().toLocaleDateString('cs-CZ', { weekday: 'long' });
      const dayOfWeekUpper = dayOfWeek.toUpperCase();

      const systemPrompt = `Jsi užitečný asistent, který extrahuje jídelní lístky z **obyčejného textu**.
                            Aktuální datum je ${today}. Dnes je ${dayOfWeek} (Česky: ${dayOfWeekUpper}).

                            Tvým úkolem je najít menu pro dnešní den (${today}).
                            1. Nejdříve hledej v textu sekci, která odpovídá dnešnímu dni: "${dayOfWeekUpper}". Pokud ji najdeš, extrahuj VŠECHNY položky pod ní.
                            2. **Pokud sekci "${dayOfWeekUpper}" nenajdeš:** Zkontroluj, jestli text neobsahuje nadpis jako "Víkendové menu", "Víkendová nabídka" nebo podobný, A ZÁROVEŇ jestli uvedený rozsah dat (pokud existuje) zahrnuje dnešní datum (${today}). Pokud ano, extrahuj VŠECHNY položky uvedené v této víkendové nabídce.
                            3. Pokud nenajdeš ani specifickou sekci pro dnešní den, ani platnou víkendovou nabídku pro dnešek, prověř, zda text neobsahuje informaci o zavření.

                            **DŮLEŽITÉ:** Pokud text explicitně uvádí, že je restaurace dnes (${today} nebo ${dayOfWeekUpper}) zavřená (např. "dnes zavřeno", "státní svátek", "sanitární den"), nastav "daily_menu" na false a do "restaurant_name" přidej poznámku "(pravděpodobně zavřeno)".
                            Pokud nenajdeš menu pro dnešek, A ZÁROVEŇ nenajdeš informaci o zavření, vrať "daily_menu": false a "menu_items": [].

                            Menu často obsahuje polévku (např. "GULÁŠOVÁ") uvedenou *před* hlavními jídly. Tuto polévku MUSÍŠ zahrnout s kategorií 'polévka'.
                            Extrahuj všechna jídla pro daný den/nabídku.
                            Normalizuj ceny na číslo (např. "145 Kč" -> 145). Pokud cena není uvedena, použij 0.
                            Alergeny by měly být pole textových řetězců (stringů). Pokud nejsou uvedeny, vrať prázdné pole [].
                            Nevymýšlej si jídla ani ceny.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the CLEANED TEXT content from the restaurant website (first 20k chars): ${textContent.substring(0, 20000)}` },
        ],
        tools: [this.menuTool],
        tool_choice: { type: 'function', function: { name: 'save_menu_json' } },
      });

      const toolCalls = response.choices[0]?.message?.tool_calls;
      if (toolCalls && toolCalls[0] && toolCalls[0].type === 'function' && toolCalls[0].function.name === 'save_menu_json' && toolCalls[0].function.arguments) {
        this.logger.log('Successfully received structured JSON from AI.');
        const toolCall = toolCalls[0];
        let menuData;
        try {
          menuData = JSON.parse(toolCall.function.arguments);
        } catch (parseError) {
          this.logger.error(`AI returned invalid JSON: ${toolCall.function.arguments}`, parseError);
          throw new HttpException('AI returned data in an invalid JSON format.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const finalResult = { ...menuData, date: today, source_url: url };
        await this.cacheManager.set(cacheKey, finalResult);
        this.logger.log(`CACHE SET: Saved menu to cache for key: ${cacheKey}`);
        return finalResult;
      } else {
        this.logger.error('AI did not call the expected tool or response format was invalid.', response.choices[0]?.message);
        throw new HttpException('AI failed to return valid menu data structure.', HttpStatus.INTERNAL_SERVER_ERROR);
      }

    } catch (error: any) {
      await this.cacheManager.del(cacheKey);
      this.logger.error(`Failed during summarize for ${url}, cache cleared. Error: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      } else if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
          throw new HttpException('Request to OCR/PDF service timed out.', HttpStatus.GATEWAY_TIMEOUT);
        } else {
          this.logger.error(`Axios error calling sub-service: ${error.response?.status} ${error.message}`);
          throw new HttpException(`Failed to communicate with OCR/PDF processing service.`, HttpStatus.BAD_GATEWAY);
        }
      } else if (error instanceof OpenAI.APIError) {
        this.logger.error(`OpenAI API Error: ${error.status} ${error.name} ${error.message}`);
        throw new HttpException(`AI processing failed: ${error.message}`, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
      } else {
        throw new HttpException(
          `An unexpected processing error occurred: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  /**
   * Fetches content from URL and returns both data and content type
   * Used to determine processing method (HTML, OCR, PDF)
   * @param url URL to fetch content from
   * @returns Fetched content with content type
   */
  private async fetchContent(url: string): Promise<FetchResult> {
    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };
      const response = await axios.get(url, { headers, timeout: 10000 });
      const contentType = response.headers['content-type'] || 'unknown';
      this.logger.log(`Successfully fetched content from ${url}. Content-Type: ${contentType}. Status: ${response.status}`);
      return { data: response.data, contentType: contentType };
    } catch (error: any) {
      this.logger.error(`Failed to fetch content from ${url}: ${error.message}`, error.stack);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          throw new HttpException(`Website link appears broken (Error 404 Not Found).`, HttpStatus.NOT_FOUND);
        } else if (axiosError.code === 'ECONNABORTED' || axiosError.response?.status === 504) {
          throw new HttpException('The website took too long to respond (Timeout).', HttpStatus.GATEWAY_TIMEOUT);
        } else if (axiosError.response?.status) {
          throw new HttpException(`The website returned an error (Status ${axiosError.response.status}).`, HttpStatus.BAD_GATEWAY);
        }
      }
      throw new HttpException(
        `Failed to retrieve content from the URL. Please check the address and your connection.`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }
}