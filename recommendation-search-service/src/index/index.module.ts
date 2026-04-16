import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { IndexedBook, IndexedBookSchema } from '../models/indexed-book.schema';
import { IndexController } from './index.controller';
import { BookshopSyncService } from './bookshop-sync.service';
import { IndexService } from './index.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IndexedBook.name, schema: IndexedBookSchema },
    ]),
  ],
  controllers: [IndexController],
  providers: [IndexService, BookshopSyncService],
  exports: [IndexService],
})
export class IndexModule {}
