import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "~/app/_components/page-header";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { listBooks } from "~/server/services/bookshop";
import { getAverageRating } from "~/server/services/reviews";

export default async function BookDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const books = await listBooks();
  const book = books.find((b) => b.id === id);
  if (!book) notFound();

  const numericBookId = Number(id);
  const canLoadReviews = Number.isFinite(numericBookId);
  const rating = canLoadReviews ? await getAverageRating(numericBookId) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={book.title}
        description={book.author ?? "Unknown author"}
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/books"
          >
            Back
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>
              Book details from Bookshop service.
            </CardDescription>
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
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Current price for this e-book.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-semibold">
              {book.price != null ? `${book.price.toFixed(2)} DT` : "N/A"}
            </div>
            <Button variant="secondary" className="w-full" disabled>
              Add to cart
            </Button>
            <p className="text-muted-foreground text-xs">
              Cart items are not modeled in the current Cart service; this
              button is intentionally disabled.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>
            Average rating is provided by the Review service.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {canLoadReviews ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {rating ? rating.averageRating.toFixed(2) : "0.00"} / 5
              </Badge>
              <span className="text-muted-foreground text-sm">
                {rating ? `${rating.reviewCount} reviews` : "No rating data"}
              </span>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              This book ID is not numeric, so it can’t be used with the Review
              service endpoints.
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/reviews">Open reviews</Link>
            </Button>
            {canLoadReviews ? (
              <Button asChild>
                <Link href={`/reviews/book/${numericBookId}`}>
                  Reviews for this book
                </Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
