import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuModule } from './menu/menu.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

/**
 * Hlavní modul aplikace
 * Konfiguruje globální moduly pro konfiguraci, cache a importuje MenuModule
 */
@Module({
  imports: [
    // Globální konfigurační modul pro environment proměnné
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Redis cache konfigurace s TTL 1 hodina
    // Ukládá výsledky extrakce menu pro rychlejší opakované dotazy
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 3600 * 1000, // 1 hodina v milisekundách
    }),

    // Modul pro zpracování menu
    MenuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }