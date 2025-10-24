// server/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // This is the line we need to see
  await app.listen(3001);

  // Let's add our own log to be 100% sure
  console.log(`Nest application is listening on http://localhost:3001`);
}
bootstrap();