import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  IndexedBook,
  IndexedBookDocument,
} from '../models/indexed-book.schema';
import { IndexService } from './index.service';

type SyncResult = {
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  fetched: number;
  indexed: number;
  error?: string;
};

@Injectable()
export class BookshopSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookshopSyncService.name);
  private timer: NodeJS.Timeout | null = null;
  private lastSync: SyncResult | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly indexService: IndexService,
    @InjectModel(IndexedBook.name)
    private readonly bookModel: Model<IndexedBookDocument>,
  ) {}

  onModuleInit() {
    const enabled = this.getAutoSyncEnabled();
    if (!enabled) return;

    // Fire-and-forget first sync; it may fail early in Docker startup.
    void this.syncOnce();

    const intervalSec = this.getAutoSyncIntervalSec();
    if (intervalSec > 0) {
      this.timer = setInterval(() => void this.syncOnce(), intervalSec * 1000);
      this.timer.unref?.();
    }
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async syncOnce(): Promise<SyncResult> {
    const startedAt = new Date();

    try {
      const baseUrl = this.getBookshopApiBaseUrl();
      const url = `${baseUrl.replace(/\/$/, '')}/books`;

      const res = await fetch(url, {
        headers: {
          accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Bookshop fetch failed: HTTP ${res.status}`);
      }

      const raw = (await res.json()) as any;
      const books = Array.isArray(raw) ? raw : [];

      const mapped = books
        .map((b) => {
          const bookId = b?.id != null ? String(b.id) : null;
          const title = typeof b?.title === 'string' ? b.title : null;
          if (!bookId || !title) return null;

          return {
            bookId,
            title,
            author: typeof b?.author === 'string' ? b.author : undefined,
            description:
              typeof b?.description === 'string' ? b.description : undefined,
            categoryName:
              typeof b?.category?.name === 'string' ? b.category.name : undefined,
            imageUrl: typeof b?.imageUrl === 'string' ? b.imageUrl : undefined,
            price: typeof b?.price === 'number' ? b.price : undefined,
          };
        })
        .filter(Boolean) as Array<{
        bookId: string;
        title: string;
        author?: string;
        description?: string;
        categoryName?: string;
        imageUrl?: string;
        price?: number;
      }>;

      const indexed = await this.indexService.upsertBooks(mapped);

      const result: SyncResult = {
        ok: true,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        fetched: books.length,
        indexed,
      };

      this.lastSync = result;
      this.logger.log(
        `Synced from bookshop: fetched=${result.fetched} indexed=${result.indexed}`,
      );

      return result;
    } catch (e: any) {
      const result: SyncResult = {
        ok: false,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        fetched: 0,
        indexed: 0,
        error: e?.message ? String(e.message) : 'Unknown error',
      };

      this.lastSync = result;
      this.logger.warn(`Bookshop sync failed: ${result.error}`);
      return result;
    }
  }

  async status() {
    const count = await this.bookModel.countDocuments({});
    return {
      enabled: this.getAutoSyncEnabled(),
      intervalSec: this.getAutoSyncIntervalSec(),
      bookshopApiBaseUrl: this.getBookshopApiBaseUrl(),
      indexedBooks: count,
      lastSync: this.lastSync,
    };
  }

  private getBookshopApiBaseUrl() {
    return (
      this.config.get<string>('BOOKSHOP_API_BASE_URL') ??
      'http://bookshop-service:8080/api'
    );
  }

  private getAutoSyncEnabled() {
    return (
      (this.config.get<string>('AUTO_INDEX_FROM_BOOKSHOP') ?? 'true')
        .toLowerCase()
        .trim() === 'true'
    );
  }

  private getAutoSyncIntervalSec() {
    const raw = (this.config.get<string>('AUTO_INDEX_INTERVAL_SEC') ?? '300')
      .trim()
      .toLowerCase();
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 300;
  }
}
