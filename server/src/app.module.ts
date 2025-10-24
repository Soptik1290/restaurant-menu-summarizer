// server/src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuModule } from './menu/menu.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager'; // 1. Import CacheModule
import { redisStore } from 'cache-manager-redis-yet'; // 2. Import the Redis driver

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    CacheModule.register({
      isGlobal: true, 
      store: redisStore,

      host: 'localhost',
      port: 6379,

      // 3600 * 1000 = 1 hour. This fulfills the task requirement
      ttl: 3600 * 1000, // TADY BYLA TA CHYBA
    }),

    MenuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}