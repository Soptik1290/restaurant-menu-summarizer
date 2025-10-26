import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuModule } from './menu/menu.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

/**
 * Main application module
 * Configures global modules for configuration, cache, and imports MenuModule
 */
@Module({
  imports: [
    // Global configuration module for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Redis cache configuration with 1 hour TTL
    // Stores menu extraction results for faster repeated queries
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 3600 * 1000, // 1 hour in milliseconds
    }),

    // Module for menu processing
    MenuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }