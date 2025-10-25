import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

/**
 * Bootstrap funkce pro inicializaci NestJS aplikace
 * Konfiguruje CORS, validaci a spouští server na portu 3001
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Povolení CORS pro cross-origin požadavky z frontendu
  app.enableCors();

  // Globální validace pro všechny příchozí požadavky
  // whitelist: true - odstraní neznámé vlastnosti z DTO
  // transform: true - automaticky transformuje typy podle DTO definic
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Spuštění serveru na portu 3001
  await app.listen(3001);
  console.log(`Nest application is listening on http://localhost:3001`);
}
bootstrap();