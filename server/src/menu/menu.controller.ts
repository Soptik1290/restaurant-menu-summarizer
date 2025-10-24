import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { MenuService } from './menu.service';
import { SummarizeMenuDto } from './dto/summarize-menu.dto';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * Extracts and summarizes menu from restaurant URL
   * Supports HTML, images (OCR), and PDF content
   */
  @Post('summarize')
  @HttpCode(200) 
  async summarizeMenu(@Body() summarizeMenuDto: SummarizeMenuDto) {
    return this.menuService.summarize(summarizeMenuDto.url);
  }
}