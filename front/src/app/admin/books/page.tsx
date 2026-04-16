"use client";

import * as React from "react";
import Link from "next/link";

import { PageHeader } from "~/app/_components/page-header";
import { ErrorState } from "~/app/_components/error-state";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useAuth } from "~/components/auth/auth-provider";
import { gatewayDelete, gatewayGet } from "~/lib/gateway-client";

type Category = {
  id: number;
  name: string;
};

type Book = {
  id: number;
  title: string;
  author?: string | null;
  price?: number | null;
  views?: number | null;
  category?: Category | null;
};

export default function AdminBooksPage() {
  const { token } = useAuth();

  const [books, setBooks] = React.useState<Book[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void gatewayGet<Book[]>("/api/books", token)
      .then((data) => {
        if (cancelled) return;
        setBooks(data ?? []);
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
  }, [token]);

  async function deleteBook(id: number) {
    const ok = window.confirm("Delete this book? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    setError(null);

    try {
      await gatewayDelete(`/api/books/${id}`, token);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      setError(e);
    } finally {
      setDeletingId(null);
    }
  }

  if (error)
    return (
      <ErrorState error={error} title="Couldn’t load books" homeHref="/admin" />
    );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Books"
        description="Bookshop service exposed through the gateway (/api/books)."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/admin/books/new">New book</Link>
            </Button>
            <Badge variant="outline">Admin</Badge>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All books</CardTitle>
          <CardDescription>Manage catalog and metadata.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground py-6 text-sm">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{b.title}</div>
                      <div className="text-muted-foreground text-xs">
                        {b.author ?? "Unknown author"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {b.category?.name ? (
                        <Badge variant="secondary">{b.category.name}</Badge>
                      ) : (
                        <Badge variant="outline">No category</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {b.price != null ? `${b.price.toFixed(2)} DT` : "—"}
                    </TableCell>
                    <TableCell className="text-right">{b.views ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/books/${b.id}`}>Edit</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          disabled={deletingId === b.id}
                          onClick={() => void deleteBook(b.id)}
                        >
                          {deletingId === b.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && !books.length ? (
            <div className="text-muted-foreground py-6 text-sm">
              No books returned.
            </div>
          ) : null}

          <div className="mt-6 flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Back</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/books">Open storefront</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
