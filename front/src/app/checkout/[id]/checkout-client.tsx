"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageHeader } from "~/app/_components/page-header";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { useAuth } from "~/components/auth/auth-provider";
import { gatewayPost } from "~/lib/gateway-client";

type Book = {
  id: string;
  title: string;
  author?: string | null;
  price?: number | null;
  isbn?: string | null;
  description?: string | null;
  views?: number | null;
  category?: { name?: string | null } | null;
};

type Cart = {
  id: number;
};

export function CheckoutClient({ book }: { book: Book }) {
  const router = useRouter();
  const { initialized, isAuthenticated, username, login, token } = useAuth();

  const customerName = username?.trim() ?? "";

  const [quantity, setQuantity] = React.useState<number>(1);
  const safeQty = Number.isFinite(quantity)
    ? Math.max(1, Math.floor(quantity))
    : 1;

  const unitPrice = book.price;
  const hasValidPrice = unitPrice != null && Number.isFinite(unitPrice);
  const totalAmount = hasValidPrice ? unitPrice * safeQty : null;
  const hasValidTotal = totalAmount != null && Number.isFinite(totalAmount);

  const [cartId, setCartId] = React.useState<number | null>(null);

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const numericBookId = Number(book.id);
  const canLinkReviews = Number.isFinite(numericBookId) && numericBookId > 0;

  async function addToCart() {
    if (!token) throw new Error("Please sign in first.");
    if (!customerName) throw new Error("Your account has no username.");
    if (!Number.isFinite(numericBookId) || numericBookId <= 0)
      throw new Error("This book has no valid numeric id.");
    if (!hasValidTotal) throw new Error("This book has no valid price.");

    const created = await gatewayPost<Cart>(
      "/carts",
      {
        customerId: null,
        customerName,
        bookId: numericBookId,
        quantity: safeQty,
        totalAmount,
        shippingAddress: null,
        notes: null,
      },
      token,
    );

    if (created?.id == null)
      throw new Error("Cart item created, but no ID returned.");
    setCartId(created.id);
  }

  async function onAddToCart() {
    setBusy(true);
    setError(null);
    setSuccess(false);

    try {
      await addToCart();
      setSuccess(true);

      window.setTimeout(() => {
        router.push("/carts");
      }, 400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add to cart failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Add to cart"
        description="Choose a quantity and add this book to your cart."
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/books/${encodeURIComponent(book.id)}`}
          >
            Back to book
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="leading-snug">{book.title}</CardTitle>
            <CardDescription>{book.author ?? "Unknown author"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {book.category?.name ? (
                <Badge variant="secondary">{book.category.name}</Badge>
              ) : (
                <Badge variant="outline">No category</Badge>
              )}
              {book.isbn ? (
                <Badge variant="outline">ISBN {book.isbn}</Badge>
              ) : null}
              {book.views != null ? (
                <Badge variant="outline">Views {book.views}</Badge>
              ) : null}
            </div>

            <Separator />

            <p className="text-muted-foreground text-sm leading-relaxed">
              {book.description ?? "No description provided."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
            <CardDescription>
              This adds a cart item. You will place the actual order from the
              carts page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!initialized ? (
              <div className="text-muted-foreground text-sm">Loading…</div>
            ) : !isAuthenticated ? (
              <Alert>
                <AlertTitle>Sign in required</AlertTitle>
                <AlertDescription>
                  Sign in as a customer (or admin) to add items to your cart.
                </AlertDescription>
              </Alert>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Couldn’t add to cart</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {success ? (
              <Alert>
                <AlertTitle>Added to cart</AlertTitle>
                <AlertDescription>Opening your cart…</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-3">
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">Customer</div>
                  {customerName ? (
                    <Badge variant="secondary">{customerName}</Badge>
                  ) : (
                    <Badge variant="outline">—</Badge>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">Unit price</div>
                  {hasValidPrice ? (
                    <Badge variant="secondary">{unitPrice.toFixed(2)} DT</Badge>
                  ) : (
                    <Badge variant="outline">N/A</Badge>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">Total</div>
                  {hasValidTotal ? (
                    <Badge variant="secondary">
                      {totalAmount.toFixed(2)} DT
                    </Badge>
                  ) : (
                    <Badge variant="outline">N/A</Badge>
                  )}
                </div>

                <div className="text-muted-foreground mt-2 text-xs">
                  Quantity is applied to the total and can be edited later in
                  your cart.
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Amount</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  step={1}
                  value={String(safeQty)}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setQuantity(Number.isFinite(n) ? n : 1);
                  }}
                />
              </div>
            </div>

            <div className="grid gap-2">
              {!isAuthenticated ? (
                <Button onClick={() => login()} variant="secondary">
                  Sign in
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => void onAddToCart()}
                    disabled={busy || success || !hasValidTotal}
                  >
                    {busy
                      ? "Adding…"
                      : success
                        ? "Done"
                        : !hasValidTotal
                          ? "Missing price"
                          : "Add to cart"}
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/carts">Cart</Link>
                  </Button>
                </div>
              )}

              {canLinkReviews ? (
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={`/reviews/book/${numericBookId}`}
                >
                  View / write reviews
                </Link>
              ) : (
                <div className="text-muted-foreground text-xs">
                  Reviews require a numeric bookId.
                </div>
              )}
            </div>

            {cartId != null ? (
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">Created</div>
                <div className="text-muted-foreground mt-1 space-y-1">
                  <div>
                    Cart item ID: <span className="font-medium">{cartId}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
