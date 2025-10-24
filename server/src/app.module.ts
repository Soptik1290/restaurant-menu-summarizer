import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuModule } from './menu/menu.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager'; 
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Redis cache configuration with 1 hour TTL
    CacheModule.register({
      isGlobal: true, 
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 3600 * 1000, // 1 hour in milliseconds
    }),

    MenuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}