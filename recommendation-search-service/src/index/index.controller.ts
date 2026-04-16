import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { BookshopSyncService } from './bookshop-sync.service';
import { IndexBooksDto } from './dto/index-books.dto';
import { IndexService } from './index.service';

@Controller('index')
export class IndexController {
  constructor(
    private readonly indexService: IndexService,
    private readonly syncService: BookshopSyncService,
  ) {}

  @Get('status')
  async status() {
    return this.syncService.status();
  }

  @Post('sync')
  async syncOnce() {
    return this.syncService.syncOnce();
  }

  @Post('books')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async indexBooks(@Body() body: IndexBooksDto) {
    const result = await this.indexService.upsertBooks(body.books);
    return { indexed: result };
  }
}
