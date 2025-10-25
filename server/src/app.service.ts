import { Injectable } from '@nestjs/common';

/**
 * Hlavní service aplikace
 * Obsahuje základní business logiku pro health check
 */
@Injectable()
export class AppService {
  /**
   * Vrací pozdrav pro health check
   * @returns Ahoj zpráva
   */
  getHello(): string {
    return 'Hello World!';
  }
}
