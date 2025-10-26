import { Injectable } from '@nestjs/common';

/**
 * Main application service
 * Contains basic business logic for health check
 */
@Injectable()
export class AppService {
  /**
   * Returns greeting for health check
   * @returns Hello message
   */
  getHello(): string {
    return 'Hello World!';
  }
}
