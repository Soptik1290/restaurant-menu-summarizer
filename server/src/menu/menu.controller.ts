import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { MenuService } from './menu.service';
import { SummarizeMenuDto } from './dto/summarize-menu.dto';

// All routes defined in this file will be prefixed with '/menu'
@Controller('menu')
export class MenuController {
  // This 'injects' the MenuService, so our controller can use it.
  constructor(private readonly menuService: MenuService) {}

  // This creates a new endpoint: POST /menu/summarize
  @Post('summarize')
  // By default, POST returns 201 Created, but 200 OK is fine for this.
  @HttpCode(200) 
  async summarizeMenu(
    // This tells NestJS to expect a 'body' in the request
    // and to validate it against our SummarizeMenuDto.
    @Body() summarizeMenuDto: SummarizeMenuDto
  ) {
    // We pass the validated URL to our 'worker' (MenuService)
    // and return whatever it gives us back.
    return this.menuService.summarize(summarizeMenuDto.url);
  }
}