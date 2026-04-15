import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { IndexedBook, IndexedBookSchema } from '../models/indexed-book.schema';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IndexedBook.name, schema: IndexedBookSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
