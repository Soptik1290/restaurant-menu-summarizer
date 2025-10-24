// server/src/menu/menu.service.ts

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MenuService {
  // We create a 'Logger' to see nice messages in the console
  private readonly logger = new Logger(MenuService.name);

  async summarize(url: string) {
    this.logger.log(`Starting summarization for URL: ${url}`);

    // Step 1: Fetch the web content
    let htmlContent: string;
    try {
      // We'll pretend to be a real browser (some sites block simple scripts)
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };

      const response = await axios.get(url, { headers });
      htmlContent = response.data;

      this.logger.log(`Successfully fetched content from ${url}. Length: ${htmlContent.length} chars.`);

    } catch (error) {
      this.logger.error(`Failed to fetch content from ${url}: ${error.message}`);

      // If fetching fails, stop and send a proper error to the user
      throw new HttpException(
        `Failed to retrieve content from URL: ${error.message}`,
        HttpStatus.BAD_GATEWAY, // 502 error - we failed to talk to the other server
      );
    }

    // TODO: Step 2: Pass 'htmlContent' to OpenAI API
    // TODO: Step 3: Implement caching

    // For now, let's just return a confirmation and a snippet
    // of the fetched HTML to prove it worked.
    return {
      status: 'success',
      receivedUrl: url,
      message: 'Content fetched successfully. AI summarization not implemented yet.',
      contentSnippet: htmlContent.substring(0, 200) + '...', // First 200 chars
    };
  }
}