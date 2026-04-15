import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IndexedBook } from '../models/indexed-book.schema';
import { UserEvent } from '../models/user-event.schema';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(UserEvent.name)
    private readonly eventModel: Model<UserEvent>,
    @InjectModel(IndexedBook.name)
    private readonly bookModel: Model<IndexedBook>,
  ) {}

  async recommendForUser(userId: number, limit: number) {
    if (!Number.isFinite(userId) || userId <= 0) {
      return {
        userId,
        strategy: 'invalid-user',
        results: [],
      };
    }

    const interacted = await this.eventModel
      .find({ userId })
      .select({ bookId: 1 })
      .lean();
    const interactedIds = new Set(interacted.map((e) => e.bookId));

    const topCategories = await this.eventModel
      .aggregate<{ _id: string; score: number }>([
        { $match: { userId, categoryName: { $ne: null } } },
        {
          $group: {
            _id: '$categoryName',
            score: {
              $sum: {
                $cond: [{ $eq: ['$type', 'PURCHASE'] }, 3, 1],
              },
            },
          },
        },
        { $sort: { score: -1 } },
        { $limit: 3 },
      ])
      .exec();

    const categories = topCategories.map((c) => c._id).filter(Boolean);

    let picked: any[] = [];
    if (categories.length) {
      picked = await this.bookModel
        .find({
          categoryName: { $in: categories },
          bookId: { $nin: Array.from(interactedIds) },
        })
        .limit(limit)
        .lean();
    }

    if (picked.length < limit) {
      const trending = await this.eventModel
        .aggregate<{
          _id: string;
          count: number;
        }>([
          { $group: { _id: '$bookId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 50 },
        ])
        .exec();

      const trendingIds = trending
        .map((t) => t._id)
        .filter((id) => !interactedIds.has(id));

      const fill = await this.bookModel
        .find({ bookId: { $in: trendingIds } })
        .limit(limit - picked.length)
        .lean();

      picked = [...picked, ...fill];
    }

    const results = picked.slice(0, limit).map((b) => ({
      bookId: b.bookId,
      title: b.title,
      author: b.author ?? null,
      categoryName: b.categoryName ?? null,
      price: b.price ?? null,
      imageUrl: b.imageUrl ?? null,
    }));

    return {
      userId,
      strategy: categories.length ? 'category-affinity+trending' : 'trending',
      categories,
      results,
    };
  }
}
