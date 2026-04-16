"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { useAuth } from "~/components/auth/auth-provider";
import { gatewayGet, gatewayPost } from "~/lib/gateway-client";

type Cart = {
  id: number;
  customerName?: string | null;
  bookId?: number | null;
  quantity?: number | null;
  totalAmount?: number | null;
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

function parseCartId(raw: string | null) {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function lineTotal(cart: Cart, book?: Book) {
  const qty = cart.quantity != null ? Math.max(1, cart.quantity) : 1;
  const unit = book?.price;
  if (unit != null && Number.isFinite(unit)) return unit * qty;

  const fallback = cart.totalAmount;
  if (fallback != null && Number.isFinite(fallback)) return fallback;

  return null;
}

export default function CartOrderPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4">
          <PageHeader title="Order" description="Loading…" />
        </div>
      }
    >
      <CartOrderPageInner />
    </React.Suspense>
  );
}

function CartOrderPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { initialized, isAuthenticated, login, token, username } = useAuth();
  const customerName = username?.trim() ?? "";

  const cartId = parseCartId(searchParams.get("cartId"));
  const isSingle = cartId != null;

  const [carts, setCarts] = React.useState<Cart[]>([]);
  const [booksById, setBooksById] = React.useState<
    Record<number, Book | undefined>
  >({});

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  const [shippingAddress, setShippingAddress] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const [busy, setBusy] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

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

        if (isSingle) {
          const found = list.find((c) => c.id === cartId);
          if (!found) {
            setCarts([]);
            setError(
              new Error("Cart item not found (it may have been deleted)."),
            );
            return;
          }
          setCarts([found]);
        } else {
          setCarts(list);
        }
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
  }, [token, customerName, isSingle, cartId]);

  React.useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) return;
    if (!customerName) return;

    const cleanup = refresh();
    return cleanup;
  }, [initialized, isAuthenticated, customerName, refresh]);

  React.useEffect(() => {
    if (!token) return;

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

  const computedLines = carts.map((c) => {
    const bookId = c.bookId;
    const book = typeof bookId === "number" ? booksById[bookId] : undefined;
    const qty = c.quantity != null ? Math.max(1, c.quantity) : 1;
    const unit = book?.price;
    const total = lineTotal(c, book);

    return {
      cart: c,
      book,
      qty,
      unit: unit != null && Number.isFinite(unit) ? unit : null,
      total,
    };
  });

  const orderTotal = computedLines.reduce<number | null>((acc, line) => {
    if (line.total == null) return null;
    if (acc == null) return line.total;
    return acc + line.total;
  }, 0);

  const title = isSingle
    ? `Order cart item #${cartId}`
    : "Order all cart items";

  async function submit() {
    if (!token) return;
    if (!customerName) return;

    setBusy(true);
    setSubmitError(null);
    setSuccess(null);

    const addr = shippingAddress.trim();
    if (!addr) {
      setBusy(false);
      setSubmitError("Please enter a shipping address.");
      return;
    }

    if (!computedLines.length) {
      setBusy(false);
      setSubmitError("Your cart is empty.");
      return;
    }

    if (orderTotal == null || !Number.isFinite(orderTotal) || orderTotal <= 0) {
      setBusy(false);
      setSubmitError(
        "Could not compute a valid total for this order. Check book prices or cart totals.",
      );
      return;
    }

    try {
      const endpoint =
        isSingle && cartId != null
          ? `/carts/order?cartId=${cartId}`
          : "/carts/order";

      await gatewayPost(
        endpoint,
        {
          customerName,
          totalAmount: orderTotal,
          shippingAddress: addr,
          notes: notes.trim() ? notes.trim() : null,
        },
        token,
      );

      setSuccess("Order placed.");

      window.setTimeout(() => {
        router.push("/carts");
      }, 700);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Couldn’t load order form"
        homeHref="/carts"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={title}
        description={
          isSingle
            ? "Confirm shipping details for this cart item."
            : "Confirm shipping details once, then place one order and clear your cart."
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/carts">Back</Link>
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
            <CardDescription>
              You need to sign in to place an order.
            </CardDescription>
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
              Your Keycloak user has no username, so we can’t scope carts to
              your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/carts">Back to cart</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>
                {loading
                  ? "Loading cart items…"
                  : isSingle
                    ? "You are ordering a single cart item."
                    : "You are ordering all current cart items."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground py-6 text-sm">
                  Loading…
                </div>
              ) : !computedLines.length ? (
                <div className="text-muted-foreground py-6 text-sm">
                  Your cart is empty.
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book</TableHead>
                        <TableHead className="text-right">Unit</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {computedLines.map(({ cart, book, qty, unit, total }) => (
                        <TableRow key={cart.id}>
                          <TableCell>
                            <div className="font-medium">
                              {book?.title ??
                                (cart.bookId
                                  ? `Book #${cart.bookId}`
                                  : "Unknown book")}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {book?.author ?? ""}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {money(unit)}
                          </TableCell>
                          <TableCell className="text-right">{qty}</TableCell>
                          <TableCell className="text-right">
                            {money(total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-muted-foreground text-sm">
                      Order total
                    </div>
                    <Badge variant="secondary">{money(orderTotal)}</Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
              <CardDescription>
                Address is required. Notes are optional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submitError ? (
                <div className="border-destructive/40 bg-destructive/5 rounded-md border p-3 text-sm">
                  <div className="text-destructive font-medium">
                    Order failed
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {submitError}
                  </div>
                </div>
              ) : null}

              {success ? (
                <div className="rounded-md border p-3 text-sm">
                  <div className="font-medium">Success</div>
                  <div className="text-muted-foreground mt-1">{success}</div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="shippingAddress">Shipping address</Label>
                <Input
                  id="shippingAddress"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street, city, country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional…"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => void submit()}
                  disabled={busy || loading}
                >
                  {busy
                    ? "Placing…"
                    : isSingle
                      ? "Confirm order"
                      : "Confirm order all"}
                </Button>
                <Button asChild variant="outline" disabled={busy}>
                  <Link href="/carts">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
