import "server-only";

import { apiGet, apiPost } from "~/server/api-client";

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
};

export type Book = {
  id: string;
  title: string;
  isbn?: string | null;
  price?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  author?: string | null;
  views?: number | null;
  category?: Category | null;
};

export async function listBooks() {
  return (await apiGet<Book[]>("/api/books")) ?? [];
}

export async function listPopularBooks() {
  return (await apiGet<Book[]>("/api/books/popular")) ?? [];
}

export async function createBook(input: Partial<Book>) {
  return apiPost<Book>("/api/books", input);
}

export async function listCategories() {
  return (await apiGet<Category[]>("/api/categories")) ?? [];
}

export async function createCategory(input: Partial<Category>) {
  return apiPost<Category>("/api/categories", input);
}
