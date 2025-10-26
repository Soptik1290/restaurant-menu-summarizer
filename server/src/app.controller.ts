import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Main application controller
 * Contains basic endpoints for health check and testing
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  /**
   * Health check endpoint
   * @returns Hello message to verify the server is running
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
