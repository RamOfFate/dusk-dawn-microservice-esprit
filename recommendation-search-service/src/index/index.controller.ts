import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { IndexBooksDto } from './dto/index-books.dto';
import { IndexService } from './index.service';

@Controller('index')
export class IndexController {
  constructor(private readonly indexService: IndexService) {}

  @Post('books')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async indexBooks(@Body() body: IndexBooksDto) {
    const result = await this.indexService.upsertBooks(body.books);
    return { indexed: result };
  }
}
