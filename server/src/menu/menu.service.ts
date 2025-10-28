// server/src/menu/menu.service.ts
import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Make sure this is imported
import axios, { AxiosError } from 'axios';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

// Define a type for fetchContent response
type FetchResult = {
  data: string;
  contentType: string;
};

// Define a type for structured errors from backend (Optional)
interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);
  private openai: OpenAI;
  private readonly menuTool: any; // Define or use 'any'
  private readonly ocrServiceUrl: string; // Store the OCR service URL
  private readonly openAiApiKeyPresent: boolean; // Flag to check API key presence
  private readonly redisUrl?: string; // Store retrieved Redis URL


  constructor(
    private configService: ConfigService, // Already injected
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openAiApiKeyPresent = !!apiKey; // Check if API key exists
    this.redisUrl = this.configService.get<string>('REDIS_URL'); // Get Redis URL

    // === GET OCR SERVICE URL FROM ENV ===
    // Get the URL from env var, default to localhost for local dev
    this.ocrServiceUrl = configService.get<string>('OCR_SERVICE_URL', 'http://localhost:8000');
    this.logger.log(`[Service Constructor] Initializing MenuService...`);
    this.logger.log(`[Service Constructor] OpenAI API Key Present: ${this.openAiApiKeyPresent}`);
    this.logger.log(`[Service Constructor] Redis URL from env: ${this.redisUrl ? '******' : 'Not Found'}`); // Don't log full Redis URL
    this.logger.log(`[Service Constructor] Using OCR Service URL: ${this.ocrServiceUrl}`);
    // === END ===

    if (!apiKey) {
      this.logger.error("[Service Constructor] CRITICAL: OPENAI_API_KEY environment variable is missing!");
      // Optionally throw: throw new Error("Missing OPENAI_API_KEY environment variable.");
    }
    this.openai = new OpenAI({ apiKey: apiKey }); // Use the retrieved key

    // Paste your full menuTool object here
    this.menuTool = {
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
  }

  async summarize(url: string) {
    this.logger.log(`[Service Summarize] Start processing URL: ${url}`);
    // Log constructor-retrieved values to ensure they are available here
    this.logger.log(`[Service Summarize] Checking constructor values - OpenAI Key Present: ${this.openAiApiKeyPresent}, Redis URL Found: ${!!this.redisUrl}, OCR URL: ${this.ocrServiceUrl}`);

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `menu:${today}:${url}`;

    try {
      this.logger.log(`[Service Summarize] Entering main try block for key: ${cacheKey}`);

      const cachedMenu = await this.cacheManager.get(cacheKey);
      if (cachedMenu) {
        this.logger.log(`CACHE HIT: Returning menu from cache for key: ${cacheKey}`);
        return cachedMenu;
      }
      this.logger.log(`CACHE MISS: Fetching menu from source for key: ${cacheKey}`);

      // Step 1: Fetch content and check its type
      const content = await this.fetchContent(url);
      let textContent: string;

      // Step 2: Process based on Content-Type
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
        this.logger.log(`Processing as Image with OCR Service at ${this.ocrServiceUrl}...`);
        // === USE THE ocrServiceUrl VARIABLE ===
        const ocrResponse = await axios.post(`${this.ocrServiceUrl}/ocr`, { url: url }, { timeout: 15000 }); // Added timeout
        textContent = ocrResponse.data.text;
         if (!textContent || textContent.trim().length < 10) {
             throw new HttpException('OCR service returned empty or very short text.', HttpStatus.UNPROCESSABLE_ENTITY); // 422
         }
        this.logger.log('Successfully received text from OCR service.');

      } else if (content.contentType.includes('application/pdf')) {
        this.logger.log(`Processing as PDF with PDF Service at ${this.ocrServiceUrl}...`);
        // === USE THE ocrServiceUrl VARIABLE ===
        const pdfResponse = await axios.post(`${this.ocrServiceUrl}/pdf`, { url: url }, { timeout: 15000 }); // Added timeout
        textContent = pdfResponse.data.text;
        if (!textContent || textContent.trim().length < 10) {
             throw new HttpException('PDF service returned empty or very short text.', HttpStatus.UNPROCESSABLE_ENTITY); // 422
         }
        this.logger.log('Successfully received text from PDF service.');

      } else {
         // Throw 415 Unsupported Media Type for anything else
        throw new HttpException(
          `Unsupported content type: ${content.contentType}. Only text/html, image/*, and application/pdf are supported.`,
          HttpStatus.UNSUPPORTED_MEDIA_TYPE // 415
        );
      }

      // Step 3: Call OpenAI
      this.logger.log('Sending extracted text to OpenAI...');
      const dayOfWeek = new Date().toLocaleDateString('cs-CZ', { weekday: 'long' });
      const dayOfWeekUpper = dayOfWeek.toUpperCase();

      // Updated prompt - includes check for "closed" status
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
        model: 'gpt-5-mini', // Your preferred model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the CLEANED TEXT content from the restaurant website (first 20k chars): ${textContent.substring(0, 20000)}` },
        ],
        tools: [this.menuTool],
        tool_choice: { type: 'function', function: { name: 'save_menu_json' } },
      });

      // Step 4: Parse and Cache Response
      const toolCalls = response.choices[0]?.message?.tool_calls;
      // Added more robust check for tool call structure
      if (toolCalls && toolCalls[0] && toolCalls[0].type === 'function' && toolCalls[0].function.name === 'save_menu_json' && toolCalls[0].function.arguments) {
         this.logger.log('Successfully received structured JSON from AI.');
         const toolCall = toolCalls[0];
         let menuData;
         try {
             menuData = JSON.parse(toolCall.function.arguments);
             console.log('[TEST DEBUG] Parsed menuData:', JSON.stringify(menuData, null, 2)); // Keep debug log for tests
         } catch(parseError: any) {
              this.logger.error(`AI returned invalid JSON: ${toolCall.function.arguments}`, parseError.stack);
              throw new HttpException('AI returned data in an invalid JSON format.', HttpStatus.INTERNAL_SERVER_ERROR); // 500
         }

        const finalResult = { ...menuData, date: today, source_url: url };
        await this.cacheManager.set(cacheKey, finalResult);
        this.logger.log(`CACHE SET: Saved menu to cache for key: ${cacheKey}`);
        return finalResult;
      } else {
          this.logger.error('AI did not call the expected tool or response format was invalid.', response.choices[0]?.message);
           // Throw 500 Internal Server Error if AI response structure is wrong
          throw new HttpException('AI failed to return valid menu data structure.', HttpStatus.INTERNAL_SERVER_ERROR); // 500
      }

    } catch (error: any) {
      // Clear cache on any error during processing
      await this.cacheManager.del(cacheKey);
      this.logger.error(`[Service Summarize] FAILED for ${url}, cache cleared. Error: ${error.message}`, error.stack); // Added more context

      // Re-throw specific HttpException if it was already one of ours
      if (error instanceof HttpException) {
        throw error;
      }
      // Handle Axios errors when calling OCR/PDF service
      else if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
              // Handle timeouts
              throw new HttpException(`Request to OCR/PDF service timed out. (${this.ocrServiceUrl})`, HttpStatus.GATEWAY_TIMEOUT); // 504
          } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
               // Handle connection refused or host not found
               throw new HttpException(`Could not connect to OCR/PDF service. (${this.ocrServiceUrl})`, HttpStatus.BAD_GATEWAY); // 502
          }
          else {
              // Handle other connection errors (e.g., service down, 5xx from service)
              this.logger.error(`Axios error calling sub-service at ${this.ocrServiceUrl}: ${error.response?.status} ${error.message}`);
              throw new HttpException(`Failed to communicate with OCR/PDF processing service.`, HttpStatus.BAD_GATEWAY); // 502
          }
      }
      // Handle potential errors from the OpenAI API call itself
      else if (error instanceof OpenAI.APIError) {
          this.logger.error(`OpenAI API Error: ${error.status} ${error.name} ${error.message}`);
          throw new HttpException(`AI processing failed: ${error.message}`, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
      }
      // Generic internal server error for any other unexpected issues
      else {
        throw new HttpException(
          `An unexpected processing error occurred: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR // 500
        );
      }
    }
  }

  // Updated fetchContent to throw more specific errors and add timeout
  private async fetchContent(url: string): Promise<FetchResult> {
    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
       };
      // Added 10 second timeout for fetching the target URL
      const response = await axios.get(url, { headers, timeout: 10000 });
      const contentType = response.headers['content-type'] || 'unknown';
      this.logger.log(`Successfully fetched content from ${url}. Content-Type: ${contentType}. Status: ${response.status}`);
      return { data: response.data, contentType: contentType };
    } catch (error: any) {
      this.logger.error(`Failed to fetch content from ${url}: ${error.message}`, error.stack);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        // Handle 404 Not Found specifically
        if (axiosError.response?.status === 404) {
          throw new HttpException(`Website link appears broken (Error 404 Not Found).`, HttpStatus.NOT_FOUND); // 404
        }
        // Handle Timeouts specifically
        else if (axiosError.code === 'ECONNABORTED') { // Axios timeout code
           throw new HttpException('The website took too long to respond (Timeout).', HttpStatus.GATEWAY_TIMEOUT); // 504
        }
         // Handle other potential HTTP errors from the target site
         else if (axiosError.response?.status) {
             throw new HttpException(`The website returned an error (Status ${axiosError.response.status}).`, HttpStatus.BAD_GATEWAY); // 502
         }
         // Handle DNS errors
         else if (axiosError.code === 'ENOTFOUND') {
             throw new HttpException(`Could not find the website at the specified URL (DNS Error).`, HttpStatus.BAD_GATEWAY); // 502
         }
      }
      // Generic fetch error (e.g., network issue)
      throw new HttpException(
        `Failed to retrieve content from the URL. Please check the address and your connection.`,
        HttpStatus.BAD_GATEWAY // 502 indicates proxy/gateway error
      );
    }
  }
}