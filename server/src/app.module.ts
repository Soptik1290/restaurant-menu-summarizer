// server/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuModule } from './menu/menu.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigService

/**
 * Main application module
 * Configures global modules for configuration, cache (conditionally for Redis URL),
 * and imports the feature module MenuModule.
 */
@Module({
  imports: [
    // Global configuration module (reads .env files)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'], // Optional: Add .env.local for local overrides
      cache: true, // Improve performance by caching env variables
    }),

    // Asynchronously register the CacheModule to use ConfigService
    CacheModule.registerAsync({
      isGlobal: true, // Make Cache available everywhere
      imports: [ConfigModule], // Make ConfigService available inside the factory
      // useFactory provides the dynamic configuration logic
      useFactory: async (configService: ConfigService) => {
        // Attempt to get the REDIS_URL from environment variables (provided by Render)
        const redisUrl = configService.get<string>('REDIS_URL');

        if (redisUrl) {
          // --- Configuration for Render (using REDIS_URL) ---
          console.log(`CacheModule: Connecting to Redis using URL: ${redisUrl}`);
          return {
            store: redisStore,
            url: redisUrl, // Use the full connection URL
            ttl: 3600 * 1000, // Default TTL: 1 hour (in milliseconds)
             // Optional: Add error handling for Redis connection
             // no_ready_check: true, // Example option if needed
          };
        } else {
          // --- Fallback Configuration for Local Docker Compose ---
          console.log('CacheModule: REDIS_URL not found, connecting to Redis using localhost:6379');
          return {
            store: redisStore,
            host: 'localhost', // Connect to Redis container via mapped port
            port: 6379,
            ttl: 3600 * 1000, // Default TTL: 1 hour
          };
        }
      },
      inject: [ConfigService], // Inject ConfigService to make it available in useFactory
    }),

    // Your feature module
    MenuModule,
  ],
  controllers: [AppController], // Default controller
  providers: [AppService],   // Default service
})
export class AppModule {}