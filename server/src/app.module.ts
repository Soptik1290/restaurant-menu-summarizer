import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuModule } from './menu/menu.module';
import { ConfigModule } from '@nestjs/config'; // <-- 1. Import

@Module({
  imports: [
    ConfigModule.forRoot({ // <-- 2. Register it
      isGlobal: true, // Makes config available everywhere
    }),
    MenuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}