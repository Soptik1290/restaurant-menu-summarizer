import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for cross-origin requests
  app.enableCors();

  // Global validation pipe for request validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen(3001);
  console.log(`Nest application is listening on http://localhost:3001`);
}
bootstrap();