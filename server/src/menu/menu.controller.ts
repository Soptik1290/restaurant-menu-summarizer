import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { MenuService } from './menu.service';
import { SummarizeMenuDto } from './dto/summarize-menu.dto';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) { }

  /**
   * Extracts and summarizes menu from restaurant URL
   * @param summarizeMenuDto DTO containing restaurant URL
   * @returns Extracted and structured menu data
   */
  @Post('summarize')
  @HttpCode(200)
  async summarizeMenu(@Body() summarizeMenuDto: SummarizeMenuDto) {
    return this.menuService.summarize(summarizeMenuDto.url);
  }
}