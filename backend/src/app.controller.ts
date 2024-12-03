import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
  @Get('example')
  getExample(@Query('id') id: string): object {
    return { message: `Received GET request`, id };
  }

  @Post('example')
  postExample(@Body() body: any): object {
    return { message: `Received POST request`, body };
  }


}
