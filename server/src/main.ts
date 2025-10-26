import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

/**
 * Bootstrap function for NestJS application initialization
 * Configures CORS, validation, and starts the server on port 3001
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for cross-origin requests from frontend
  app.enableCors();

  // Global validation for all incoming requests
  // whitelist: true - removes unknown properties from DTOs
  // transform: true - automatically transforms types according to DTO definitions
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Start the server on port 3001
  await app.listen(3001);
  console.log(`Nest application is listening on http://localhost:3001`);
}
bootstrap();