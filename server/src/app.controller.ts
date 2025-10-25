import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Hlavní controller aplikace
 * Obsahuje základní endpointy pro health check a testování
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  /**
   * Health check endpoint
   * @returns Ahoj zpráva pro ověření, že server běží
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
