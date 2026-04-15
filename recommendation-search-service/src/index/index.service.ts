import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  IndexedBook,
  IndexedBookDocument,
} from '../models/indexed-book.schema';
import { IndexBookItemDto } from './dto/index-books.dto';

@Injectable()
export class IndexService {
  constructor(
    @InjectModel(IndexedBook.name)
    private readonly bookModel: Model<IndexedBookDocument>,
  ) {}

  async upsertBooks(books: IndexBookItemDto[]) {
    if (!books.length) return 0;

    const ops = books.map((b) => ({
      updateOne: {
        filter: { bookId: b.bookId },
        update: {
          $set: {
            bookId: b.bookId,
            title: b.title,
            author: b.author,
            description: b.description,
            categoryName: b.categoryName,
            imageUrl: b.imageUrl,
            price: b.price,
          },
        },
        upsert: true,
      },
    }));

    const res = await this.bookModel.bulkWrite(ops, { ordered: false });
    return (res.upsertedCount ?? 0) + (res.modifiedCount ?? 0);
  }
}
