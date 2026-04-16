"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
import { gatewayPost } from "~/lib/gateway-client";

type CreateBookBody = {
  title: string;
  author: string;
  isbn: string;
  price: number;
  views: number;
  imageUrl: string;
  description: string;
  categoryId: string;
};

export default function AdminCreateBookPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [form, setForm] = React.useState<CreateBookBody>({
    title: "",
    author: "",
    isbn: "",
    price: 0,
    views: 0,
    imageUrl: "",
    description: "",
    categoryId: "",
  });

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const categoryId = Number(form.categoryId);
    const body = {
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
      await gatewayPost("/api/books", body, token);
      router.push("/admin/books");
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Couldn’t create book"
        homeHref="/admin/books"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create book"
        description="Create a new book in the Bookshop service (through the gateway)."
        actions={<Badge variant="outline">Admin</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Category is optional (use an existing category ID).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
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
                    setForm((f) => ({ ...f, author: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={form.isbn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isbn: e.target.value }))
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
                    setForm((f) => ({ ...f, price: Number(e.target.value) }))
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
                    setForm((f) => ({ ...f, views: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageUrl: e.target.value }))
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
                    setForm((f) => ({ ...f, categoryId: e.target.value }))
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
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={6}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/books">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
