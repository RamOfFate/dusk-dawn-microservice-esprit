import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "~/app/_components/page-header";
import { ErrorState } from "~/app/_components/error-state";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { listBooks } from "~/server/services/bookshop";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let books: Awaited<ReturnType<typeof listBooks>> = [];
  try {
    books = await listBooks();
  } catch (e) {
    return <ErrorState error={e} title="Couldn’t load checkout" />;
  }

  const book = books.find((b) => b.id === id);
  if (!book) notFound();

  const amount = book.price ?? null;
  const amountQuery = amount != null ? String(amount) : "";
  const numericBookId = Number(book.id);
  const canLinkReviews = Number.isFinite(numericBookId) && numericBookId > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Checkout"
        description="A guided flow across Cart + Order microservices."
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
            <CardTitle>Total</CardTitle>
            <CardDescription>
              Used to prefill cart/order totals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-semibold">
              {amount != null ? `${amount.toFixed(2)} DT` : "Set manually"}
            </div>

            <div className="grid gap-2">
              <Link
                className={buttonVariants({ variant: "default" })}
                href={`/carts/new${amountQuery ? `?totalAmount=${encodeURIComponent(amountQuery)}` : ""}`}
              >
                Step 1: Create cart
              </Link>
              <Link
                className={buttonVariants({ variant: "secondary" })}
                href={`/orders/new${amountQuery ? `?totalAmount=${encodeURIComponent(amountQuery)}` : ""}`}
              >
                Step 2: Create order
              </Link>
              {canLinkReviews ? (
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={`/reviews/book/${numericBookId}`}
                >
                  Reviews
                </Link>
              ) : (
                <div className="text-muted-foreground text-xs">
                  Reviews require a numeric bookId.
                </div>
              )}
            </div>

            <div className="text-muted-foreground text-xs">
              This project’s Cart service models a cart header (totals +
              address), not line items.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
