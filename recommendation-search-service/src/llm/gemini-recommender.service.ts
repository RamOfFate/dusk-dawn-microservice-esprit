import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type LlmCandidateBook = {
  bookId: string;
  title: string;
  author?: string | null;
  categoryName?: string | null;
  price?: number | null;
};

export type LlmUserEvent = {
  bookId: string;
  type: 'VIEW' | 'PURCHASE';
  categoryName?: string | null;
};

@Injectable()
export class GeminiRecommenderService {
  private readonly logger = new Logger(GeminiRecommenderService.name);

  constructor(private readonly config: ConfigService) {}

  isEnabled() {
    return Boolean(this.getApiKey());
  }

  async recommend(input: {
    userId: string;
    limit: number;
    recentEvents: LlmUserEvent[];
    candidates: LlmCandidateBook[];
  }): Promise<{
    bookIds: string[];
    rawText?: string;
  }> {
    const apiKey = this.getApiKey();
    if (!apiKey) return { bookIds: [] };

    const modelName =
      this.config.get<string>('GEMINI_MODEL') ?? 'gemini-1.5-flash';

    const prompt = this.buildPrompt({
      userId: input.userId,
      limit: input.limit,
      recentEvents: input.recentEvents,
      candidates: input.candidates,
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const res = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
      },
    });

    const text = res.response.text() ?? '';
    const parsed = this.tryParseJson(text);

    const candidateSet = new Set(input.candidates.map((c) => c.bookId));

    const rawIds =
      (Array.isArray(parsed)
        ? parsed
        : ((parsed as any)?.bookIds ?? (parsed as any)?.books)) ?? [];

    const ids = (Array.isArray(rawIds) ? rawIds : [])
      .map((x) => (x != null ? String(x) : ''))
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((id) => candidateSet.has(id));

    const unique: string[] = [];
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      unique.push(id);
      if (unique.length >= input.limit) break;
    }

    if (!unique.length) {
      this.logger.warn('Gemini returned no usable bookIds; falling back.');
    }

    return { bookIds: unique, rawText: text };
  }

  private buildPrompt(input: {
    userId: string;
    limit: number;
    recentEvents: LlmUserEvent[];
    candidates: LlmCandidateBook[];
  }) {
    const eventsText = input.recentEvents
      .slice(0, 30)
      .map((e) => {
        const cat = e.categoryName ? ` | category=${e.categoryName}` : '';
        return `- ${e.type} bookId=${e.bookId}${cat}`;
      })
      .join('\n');

    const candidatesText = input.candidates
      .slice(0, 60)
      .map((c) => {
        const author = c.author ? ` | author=${c.author}` : '';
        const cat = c.categoryName ? ` | category=${c.categoryName}` : '';
        const price = typeof c.price === 'number' ? ` | price=${c.price}` : '';
        return `- bookId=${c.bookId} | title=${c.title}${author}${cat}${price}`;
      })
      .join('\n');

    return [
      'You are a recommender system for an online bookshop.',
      '',
      `Goal: pick up to ${input.limit} bookIds to recommend to userId=${input.userId}.`,
      'Hard rules:',
      '1) Only choose bookIds from the provided CANDIDATES list.',
      `2) Return JSON ONLY (no markdown, no code fences), using this schema: {"bookIds": ["<id>", ...]}.`,
      `3) Return at most ${input.limit} ids, unique.`,
      '',
      'USER RECENT EVENTS (most recent first):',
      eventsText || '- (no history)',
      '',
      'CANDIDATES:',
      candidatesText || '- (none)',
      '',
      'Return the JSON now.',
    ].join('\n');
  }

  private getApiKey() {
    const raw = this.config.get<string>('GOOGLE_AI_STUDIO_API_KEY');
    const key = raw?.trim();
    return key ? key : null;
  }

  private tryParseJson(text: string): unknown {
    const trimmed = text.trim();
    if (!trimmed) return null;

    // 1) Direct parse
    try {
      return JSON.parse(trimmed);
    } catch {
      // ignore
    }

    // 2) Strip code fences if present
    const unfenced = trimmed
      .replace(/^```[a-zA-Z]*\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim();

    try {
      return JSON.parse(unfenced);
    } catch {
      // ignore
    }

    // 3) Extract first JSON object/array region
    const objStart = unfenced.indexOf('{');
    const objEnd = unfenced.lastIndexOf('}');
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
      const slice = unfenced.slice(objStart, objEnd + 1);
      try {
        return JSON.parse(slice);
      } catch {
        // ignore
      }
    }

    const arrStart = unfenced.indexOf('[');
    const arrEnd = unfenced.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
      const slice = unfenced.slice(arrStart, arrEnd + 1);
      try {
        return JSON.parse(slice);
      } catch {
        // ignore
      }
    }

    return null;
  }
}
