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
import { Input } from "~/components/ui/input";
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

type Cart = {
  id: number;
  customerName?: string | null;
  bookId?: number | null;
  quantity?: number | null;
  totalAmount?: number | null;
  shippingAddress?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type Book = {
  id: number;
  title: string;
  price?: number | null;
  author?: string | null;
};

function money(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)} DT`;
}

export default function CartsPage() {
  const { initialized, isAuthenticated, login, token, username } = useAuth();
  const customerName = username?.trim() ?? "";

  const [carts, setCarts] = React.useState<Cart[]>([]);
  const [booksById, setBooksById] = React.useState<Record<number, Book | undefined>>({});

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [savingId, setSavingId] = React.useState<number | null>(null);

  const [qtyDraft, setQtyDraft] = React.useState<Record<number, number>>({});

  const refresh = React.useCallback(() => {
    if (!token) return;
    if (!customerName) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const encoded = encodeURIComponent(customerName);

    void gatewayGet<Cart[]>(`/carts/customerName/${encoded}`, token)
      .then((data) => {
        if (cancelled) return;
        const list = data ?? [];
        setCarts(list);

        setQtyDraft((prev) => {
          const next = { ...prev };
          for (const c of list) {
            if (typeof c.id === "number" && c.quantity != null && next[c.id] == null) {
              next[c.id] = c.quantity;
            }
          }
          return next;
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
  }, [customerName, token]);

  React.useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) return;
    if (!customerName) return;

    const cleanup = refresh();
    return cleanup;
  }, [initialized, isAuthenticated, customerName, refresh]);

  React.useEffect(() => {
    const bookIds = Array.from(
      new Set(
        carts
          .map((c) => c.bookId)
          .filter((id): id is number => typeof id === "number" && id > 0),
      ),
    );

    const missing = bookIds.filter((id) => booksById[id] == null);
    if (!missing.length) return;

    let cancelled = false;

    void Promise.all(
      missing.map(async (id) => {
        try {
          const b = await gatewayGet<Book>(`/api/books/${id}`, token);
          return [id, b ?? undefined] as const;
        } catch {
          return [id, undefined] as const;
        }
      }),
    ).then((pairs) => {
      if (cancelled) return;
      setBooksById((prev) => {
        const next = { ...prev };
        for (const [id, book] of pairs) next[id] = book;
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [carts, booksById, token]);

  async function deleteCart(id: number) {
    if (!token) return;

    const ok = window.confirm("Delete this cart item? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    setError(null);

    try {
      await gatewayDelete(`/carts/${id}`, token);
      setCarts((prev) => prev.filter((c) => c.id !== id));
      setQtyDraft((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      setError(e);
    } finally {
      setDeletingId(null);
    }
  }

  async function saveQuantity(cart: Cart) {
    if (!token) return;

    const draft = qtyDraft[cart.id];
    const qty =
      typeof draft === "number" && Number.isFinite(draft)
        ? Math.max(1, Math.floor(draft))
        : 1;

    const bookId = cart.bookId;
    const book = typeof bookId === "number" ? booksById[bookId] : undefined;
    const unit = book?.price;

    const totalAmount =
      unit != null && Number.isFinite(unit) ? unit * qty : cart.totalAmount ?? null;

    setSavingId(cart.id);
    setError(null);

    try {
      const updated = await gatewayPut<Cart>(
        `/carts/${cart.id}`,
        { quantity: qty, totalAmount },
        token,
      );

      setCarts((prev) =>
        prev.map((c) => (c.id === cart.id ? { ...c, ...(updated ?? {}), quantity: qty, totalAmount } : c)),
      );
      setQtyDraft((prev) => ({ ...prev, [cart.id]: qty }));
    } catch (e) {
      setError(e);
    } finally {
      setSavingId(null);
    }
  }


  if (error)
    return (
      <ErrorState error={error} title="Couldn’t load carts" homeHref="/books" />
    );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cart"
        description="Cart items you added. You can change the amount, delete items, or proceed to order."
        actions={
          <div className="flex items-center gap-2">
            {carts.length ? (
              <Button asChild size="sm">
                <Link href="/carts/order">Order all</Link>
              </Button>
            ) : (
              <Button size="sm" disabled>
                Order all
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={!isAuthenticated || loading || !customerName}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
            <Badge variant="outline">{customerName || "Customer"}</Badge>
          </div>
        }
      />

      {!initialized ? (
        <div className="text-muted-foreground py-6 text-sm">Loading…</div>
      ) : !isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>You need to sign in to view your cart.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => login()}>Sign in</Button>
            <Button asChild variant="outline">
              <Link href="/books">Browse books</Link>
            </Button>
          </CardContent>
        </Card>
      ) : !customerName ? (
        <Card>
          <CardHeader>
            <CardTitle>Missing username</CardTitle>
            <CardDescription>
              Your Keycloak user has no username, so we can’t scope carts to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/books">Back to books</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>
                Each row is one cart item. Use “Order” to open the checkout form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carts.map((c) => {
                    const bookId = c.bookId;
                    const book = typeof bookId === "number" ? booksById[bookId] : undefined;
                    const qty = c.quantity != null ? Math.max(1, c.quantity) : 1;
                    const unit = book?.price;
                    const computedTotal =
                      unit != null && Number.isFinite(unit) ? unit * qty : c.totalAmount ?? null;

                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">
                            {book?.title ?? (bookId ? `Book #${bookId}` : "Unknown book")}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {book?.author ?? ""}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{money(unit)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              className="w-24"
                              type="number"
                              min={1}
                              step={1}
                              value={String(qtyDraft[c.id] ?? qty)}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                setQtyDraft((prev) => ({
                                  ...prev,
                                  [c.id]: Number.isFinite(n) ? n : 1,
                                }));
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={savingId === c.id}
                              onClick={() => void saveQuantity(c)}
                            >
                              {savingId === c.id ? "Saving…" : "Save"}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{money(computedTotal)}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button asChild size="sm">
                              <Link href={`/carts/order?cartId=${encodeURIComponent(String(c.id))}`}>Order</Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              disabled={deletingId === c.id}
                              onClick={() => void deleteCart(c.id)}
                            >
                              {deletingId === c.id ? "Deleting…" : "Delete"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {!loading && !carts.length ? (
                <div className="text-muted-foreground py-6 text-sm">Your cart is empty.</div>
              ) : null}

              <div className="mt-6 flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/books">Back to books</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
