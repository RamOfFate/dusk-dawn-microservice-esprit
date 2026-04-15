import "server-only";

import { ApiError, apiGet, apiPost } from "~/server/api-client";

export type AverageRatingResponse = {
  bookId: number;
  averageRating: number;
  reviewCount: number;
};

export type ReviewResponse = {
  id: number;
  userId: number;
  bookId: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

export type PagedReviewsResponse = {
  content: ReviewResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

type ReviewCreateRequest = {
  userId?: number;
  bookId: number;
  rating: number;
  comment?: string;
};

async function reviewGet<T>(path: string): Promise<T | null> {
  // Prefer direct `/reviews/**` (if gateway route exists), fallback to discovery-locator
  // default (`/review-service/**`) when review service is only reachable by serviceId.
  try {
    return await apiGet<T>(path);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return apiGet<T>(`/review-service${path}`);
    }
    throw e;
  }
}

async function reviewPost<T>(path: string, body: unknown): Promise<T | null> {
  try {
    return await apiPost<T>(path, body);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return apiPost<T>(`/review-service${path}`, body);
    }
    throw e;
  }
}

export async function getAverageRating(bookId: number) {
  return reviewGet<AverageRatingResponse>(`/reviews/book/${bookId}/average`);
}

export async function listReviewsByBook(
  bookId: number,
  opts?: { sort?: "latest" | "rating"; page?: number; size?: number },
) {
  const params = new URLSearchParams();
  params.set("sort", opts?.sort ?? "latest");
  params.set("page", String(opts?.page ?? 0));
  params.set("size", String(opts?.size ?? 20));
  return reviewGet<PagedReviewsResponse>(
    `/reviews/book/${bookId}?${params.toString()}`,
  );
}

export async function createReview(input: ReviewCreateRequest) {
  return reviewPost<ReviewResponse>("/reviews", input);
}
