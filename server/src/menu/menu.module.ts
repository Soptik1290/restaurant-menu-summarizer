import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';

/**
 * Menu processing module
 * Contains controller and service for menu extraction and summarization
 */
@Module({
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule { }
