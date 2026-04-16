"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "~/app/_components/page-header";
import { ErrorState } from "~/app/_components/error-state";
import { useAuth } from "~/components/auth/auth-provider";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { gatewayDelete, gatewayGet, gatewayPut } from "~/lib/gateway-client";

type Category = {
  id: number;
  name?: string | null;
};

type Book = {
  id: number;
  title: string;
  author?: string | null;
  isbn?: string | null;
  price?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  views?: number | null;
  category?: Category | null;
};

type EditBookForm = {
  title: string;
  author: string;
  isbn: string;
  price: number;
  views: number;
  imageUrl: string;
  description: string;
  categoryId: string;
};

export default function AdminEditBookPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();

  const bookIdRaw = params?.id;
  const bookId = typeof bookIdRaw === "string" ? Number(bookIdRaw) : NaN;

  const [book, setBook] = React.useState<Book | null>(null);
  const [form, setForm] = React.useState<EditBookForm | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  React.useEffect(() => {
    if (!Number.isFinite(bookId) || bookId <= 0) {
      setLoading(false);
      setError(new Error("Invalid book id"));
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void gatewayGet<Book>(`/api/books/${bookId}`, token)
      .then((data) => {
        if (cancelled) return;
        if (!data) throw new Error("Book not found");

        setBook(data);
        setForm({
          title: data.title ?? "",
          author: data.author ?? "",
          isbn: data.isbn ?? "",
          price: data.price ?? 0,
          views: data.views ?? 0,
          imageUrl: data.imageUrl ?? "",
          description: data.description ?? "",
          categoryId: data.category?.id != null ? String(data.category.id) : "",
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, bookId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    setSaving(true);
    setError(null);

    const categoryId = Number(form.categoryId);
    const body = {
      id: bookId,
      title: form.title,
      author: form.author || null,
      isbn: form.isbn || null,
      price: Number.isFinite(form.price) ? form.price : null,
      views: Number.isFinite(form.views) ? form.views : 0,
      imageUrl: form.imageUrl || null,
      description: form.description || null,
      category:
        Number.isFinite(categoryId) && categoryId > 0
          ? { id: categoryId }
          : null,
    };

    try {
      await gatewayPut(`/api/books/${bookId}`, body, token);
      router.push("/admin/books");
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!Number.isFinite(bookId) || bookId <= 0) return;
    const ok = window.confirm("Delete this book? This cannot be undone.");
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      await gatewayDelete(`/api/books/${bookId}`, token);
      router.push("/admin/books");
    } catch (err) {
      setError(err);
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Couldn’t load book"
        homeHref="/admin/books"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={loading ? "Edit book" : `Edit book #${book?.id ?? bookId}`}
        description="Update book metadata."
        actions={<Badge variant="outline">Admin</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Book</CardTitle>
          <CardDescription>
            Category is optional (use an existing category ID).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || !form ? (
            <div className="text-muted-foreground py-6 text-sm">Loading…</div>
          ) : (
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => (f ? { ...f, title: e.target.value } : f))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={form.author}
                    onChange={(e) =>
                      setForm((f) => (f ? { ...f, author: e.target.value } : f))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={form.isbn}
                    onChange={(e) =>
                      setForm((f) => (f ? { ...f, isbn: e.target.value } : f))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={String(form.price)}
                    onChange={(e) =>
                      setForm((f) =>
                        f ? { ...f, price: Number(e.target.value) } : f,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="views">Views</Label>
                  <Input
                    id="views"
                    type="number"
                    step="1"
                    value={String(form.views)}
                    onChange={(e) =>
                      setForm((f) =>
                        f ? { ...f, views: Number(e.target.value) } : f,
                      )
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm((f) =>
                        f ? { ...f, imageUrl: e.target.value } : f,
                      )
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="categoryId">Category ID</Label>
                  <Input
                    id="categoryId"
                    inputMode="numeric"
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm((f) =>
                        f ? { ...f, categoryId: e.target.value } : f,
                      )
                    }
                    placeholder="(optional)"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) =>
                        f ? { ...f, description: e.target.value } : f,
                      )
                    }
                    rows={6}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/admin/books">Cancel</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive"
                  disabled={deleting}
                  onClick={() => void onDelete()}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
