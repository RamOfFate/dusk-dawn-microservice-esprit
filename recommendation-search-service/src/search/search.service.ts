import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IndexedBook } from '../models/indexed-book.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(IndexedBook.name)
    private readonly bookModel: Model<IndexedBook>,
  ) {}

  async search(query: string, limit: number) {
    const q = query.trim();

    if (!q) {
      const items = await this.bookModel
        .find({})
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();
      return { query: q, results: items.map(this.toDto) };
    }

    try {
      const items = await this.bookModel
        .find(
          { $text: { $search: q } },
          {
            score: { $meta: 'textScore' },
          } as unknown as undefined,
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();

      return { query: q, results: items.map(this.toDto) };
    } catch {
      // Fallback when Mongo text indexes are missing/not ready.
      const safe = this.escapeRegExp(q);
      const rx = new RegExp(safe, 'i');

      const items = await this.bookModel
        .find({
          $or: [
            { title: rx },
            { author: rx },
            { description: rx },
            { categoryName: rx },
          ],
        })
        .limit(limit)
        .lean();

      return { query: q, results: items.map(this.toDto) };
    }
  }

  private escapeRegExp(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toDto(doc: any) {
    return {
      bookId: doc.bookId,
      title: doc.title,
      author: doc.author ?? null,
      description: doc.description ?? null,
      categoryName: doc.categoryName ?? null,
      imageUrl: doc.imageUrl ?? null,
      price: doc.price ?? null,
    };
  }
}
