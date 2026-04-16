import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { GeminiRecommenderService } from '../llm/gemini-recommender.service';
import { IndexedBook } from '../models/indexed-book.schema';
import { UserEvent } from '../models/user-event.schema';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(UserEvent.name)
    private readonly eventModel: Model<UserEvent>,
    @InjectModel(IndexedBook.name)
    private readonly bookModel: Model<IndexedBook>,
    private readonly gemini: GeminiRecommenderService,
  ) {}

  async recommendForUser(userIdRaw: string, limitRaw: number) {
    const limit = this.clampLimit(limitRaw);
    const userId = String(userIdRaw ?? '').trim();

    if (!userId) {
      return {
        userId,
        strategy: 'invalid-user',
        results: [],
      };
    }

    const indexedCount = await this.bookModel.estimatedDocumentCount();
    if (indexedCount <= 0) {
      return {
        userId,
        strategy: 'no-index-data',
        results: [],
      };
    }

    const interacted = await this.eventModel
      .find({ userId })
      .select({ bookId: 1 })
      .lean();
    const interactedIds = new Set(interacted.map((e: any) => e.bookId));

    const recentEvents = await this.eventModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .select({ bookId: 1, type: 1, categoryName: 1, _id: 0 })
      .lean();

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

    const candidates = await this.buildCandidates({
      candidateLimit: Math.min(60, Math.max(30, limit * 6)),
      categories,
      interactedIds,
    });

    // Preferred strategy: LLM-based recommendations (Gemini) if configured.
    if (this.gemini.isEnabled() && candidates.length) {
      const llm = await this.gemini.recommend({
        userId,
        limit,
        recentEvents: recentEvents.map((e: any) => ({
          bookId: String(e.bookId),
          type: e.type,
          categoryName: e.categoryName ?? null,
        })),
        candidates: candidates.map((b: any) => ({
          bookId: String(b.bookId),
          title: b.title,
          author: b.author ?? null,
          categoryName: b.categoryName ?? null,
          price: b.price ?? null,
        })),
      });

      if (llm.bookIds.length) {
        const docs = await this.bookModel
          .find({ bookId: { $in: llm.bookIds } })
          .lean();

        const byId = new Map(docs.map((d: any) => [String(d.bookId), d]));
        const ordered = llm.bookIds
          .map((id) => byId.get(id))
          .filter(Boolean)
          .slice(0, limit);

        return {
          userId,
          strategy: 'llm-gemini',
          results: ordered.map(this.toDto),
        };
      }
      // If the LLM fails to return usable IDs, fall back to deterministic logic.
    }

    return this.legacyRecommend({ userId, limit, categories, interactedIds });
  }

  private async buildCandidates(input: {
    candidateLimit: number;
    categories: string[];
    interactedIds: Set<string>;
  }) {
    const picked: any[] = [];
    const pushUnique = (docs: any[]) => {
      for (const d of docs) {
        if (!d?.bookId) continue;
        const id = String(d.bookId);
        if (input.interactedIds.has(id)) continue;
        if (picked.some((x) => String(x.bookId) === id)) continue;
        picked.push(d);
        if (picked.length >= input.candidateLimit) return;
      }
    };

    if (input.categories.length) {
      const byCategory = await this.bookModel
        .find({
          categoryName: { $in: input.categories },
          bookId: { $nin: Array.from(input.interactedIds) },
        })
        .limit(input.candidateLimit)
        .lean();
      pushUnique(byCategory);
    }

    if (picked.length < input.candidateLimit) {
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
        .map((t) => String(t._id))
        .filter((id) => !input.interactedIds.has(id));

      if (trendingIds.length) {
        const docs = await this.bookModel
          .find({ bookId: { $in: trendingIds } })
          .limit(input.candidateLimit)
          .lean();
        pushUnique(docs);
      }
    }

    if (picked.length < input.candidateLimit) {
      const newest = await this.bookModel
        .find({ bookId: { $nin: Array.from(input.interactedIds) } })
        .sort({ updatedAt: -1 })
        .limit(input.candidateLimit)
        .lean();
      pushUnique(newest);
    }

    return picked.slice(0, input.candidateLimit);
  }

  private async legacyRecommend(input: {
    userId: string;
    limit: number;
    categories: string[];
    interactedIds: Set<string>;
  }) {
    let picked: any[] = [];

    if (input.categories.length) {
      picked = await this.bookModel
        .find({
          categoryName: { $in: input.categories },
          bookId: { $nin: Array.from(input.interactedIds) },
        })
        .limit(input.limit)
        .lean();
    }

    if (picked.length < input.limit) {
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
        .map((t) => String(t._id))
        .filter((id) => !input.interactedIds.has(id));

      const fill = await this.bookModel
        .find({ bookId: { $in: trendingIds } })
        .limit(input.limit - picked.length)
        .lean();

      picked = [...picked, ...fill];
    }

    // Cold-start fallback: if there are no events yet (or trending yields no docs),
    // recommend newest books so the UI is never empty.
    if (picked.length < input.limit) {
      const excludeIds = new Set<string>([
        ...Array.from(input.interactedIds).map(String),
        ...picked.map((p: any) => String(p.bookId)),
      ]);

      const newest = await this.bookModel
        .find({ bookId: { $nin: Array.from(excludeIds) } })
        .sort({ updatedAt: -1 })
        .limit(input.limit - picked.length)
        .lean();

      picked = [...picked, ...newest];
    }

    return {
      userId: input.userId,
      strategy: input.categories.length
        ? 'category-affinity+trending'
        : 'trending',
      categories: input.categories,
      results: picked.slice(0, input.limit).map(this.toDto),
    };
  }

  private clampLimit(limitRaw: number) {
    const n = Number(limitRaw);
    if (!Number.isFinite(n)) return 10;
    return Math.max(1, Math.min(50, Math.floor(n)));
  }

  private toDto(doc: any) {
    return {
      bookId: String(doc.bookId),
      title: doc.title,
      author: doc.author ?? null,
      categoryName: doc.categoryName ?? null,
      price: doc.price ?? null,
      imageUrl: doc.imageUrl ?? null,
    };
  }
}
