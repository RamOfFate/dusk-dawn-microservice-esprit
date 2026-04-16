"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useAuth } from "~/components/auth/auth-provider";
import { gatewayDelete, gatewayGet, gatewayPut } from "~/lib/gateway-client";

type Review = {
  id: number;
  customerName: string;
  bookId: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

type PagedReviews = {
  content: Review[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export default function AdminReviewsPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const bookIdParam = searchParams.get("bookId");

  const [bookId, setBookId] = React.useState(() => {
    const n = bookIdParam ? Number(bookIdParam) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 1;
  });
  const [data, setData] = React.useState<PagedReviews | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  const [editing, setEditing] = React.useState<Review | null>(null);
  const [editRating, setEditRating] = React.useState<number>(5);
  const [editComment, setEditComment] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  async function load(forBookId: number = bookId) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("sort", "latest");
      params.set("page", "0");
      params.set("size", "25");
      const res = await gatewayGet<PagedReviews>(
        `/reviews/book/${forBookId}?${params.toString()}`,
        token,
      );
      setData(res);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(r: Review) {
    setEditing(r);
    setEditRating(r.rating);
    setEditComment(r.comment ?? "");
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    setError(null);

    try {
      await gatewayPut(
        `/reviews/${editing.id}`,
        {
          rating: editRating,
          comment: editComment.trim() ? editComment : null,
        },
        token,
      );
      setEditing(null);
      await load(bookId);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  async function deleteReview(id: number) {
    const ok = window.confirm("Delete this review? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    setError(null);

    try {
      await gatewayDelete(`/reviews/${id}`, token);
      await load(bookId);
    } catch (e) {
      setError(e);
    } finally {
      setDeletingId(null);
    }
  }

  React.useEffect(() => {
    if (!bookIdParam) return;
    const n = Number(bookIdParam);
    if (!Number.isFinite(n) || n <= 0) return;
    if (n === bookId) return;
    setBookId(n);
    void load(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookIdParam]);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error)
    return (
      <ErrorState
        error={error}
        title="Couldn’t load reviews"
        homeHref="/admin"
      />
    );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reviews"
        description="Review service exposed through the gateway."
        actions={<Badge variant="outline">Admin</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Load reviews for a numeric book ID.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              void load();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="bookId">Book ID</Label>
              <Input
                id="bookId"
                value={String(bookId)}
                onChange={(e) => setBookId(Number(e.target.value) || 1)}
                inputMode="numeric"
              />
            </div>
            <Button type="submit" variant="secondary">
              Load
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            {data ? `${data.totalElements} reviews` : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="mb-6 space-y-4 rounded-md border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">
                    Editing review #{editing.id}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Book {editing.bookId} • Customer {editing.customerName}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                >
                  Close
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editRating">Rating (1-5)</Label>
                  <Input
                    id="editRating"
                    type="number"
                    min={1}
                    max={5}
                    value={String(editRating)}
                    onChange={(e) =>
                      setEditRating(
                        Math.max(1, Math.min(5, Number(e.target.value) || 1)),
                      )
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="editComment">Comment</Label>
                  <Textarea
                    id="editComment"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    rows={4}
                    placeholder="(optional)"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="text-muted-foreground py-6 text-sm">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.content ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.id}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.customerName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.rating}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate">
                      {r.comment ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.createdAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(r)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          disabled={deletingId === r.id}
                          onClick={() => void deleteReview(r.id)}
                        >
                          {deletingId === r.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && !(data?.content?.length ?? 0) ? (
            <div className="text-muted-foreground py-6 text-sm">
              No reviews returned.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
