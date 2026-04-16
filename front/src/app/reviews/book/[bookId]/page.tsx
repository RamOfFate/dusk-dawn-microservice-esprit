import Link from "next/link";

import { PageHeader } from "~/app/_components/page-header";
import { ErrorState } from "~/app/_components/error-state";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
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
import { getAverageRating, listReviewsByBook } from "~/server/services/reviews";
import { ReviewForm } from "./review-form";

export default async function ReviewsByBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const numericBookId = Number(bookId);

  if (!Number.isFinite(numericBookId) || numericBookId <= 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Reviews"
          description="Review service requires a numeric bookId."
          actions={
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/reviews"
            >
              Back
            </Link>
          }
        />

        <Alert variant="destructive">
          <AlertTitle>Invalid book ID</AlertTitle>
          <AlertDescription>
            Please provide a positive numeric book ID (example: 1).
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  let avg: Awaited<ReturnType<typeof getAverageRating>> | null = null;
  let paged: Awaited<ReturnType<typeof listReviewsByBook>> | null = null;

  try {
    [avg, paged] = await Promise.all([
      getAverageRating(numericBookId),
      listReviewsByBook(numericBookId, { sort: "latest", page: 0, size: 20 }),
    ]);
  } catch (e) {
    return <ErrorState error={e} title="Couldn’t load reviews" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Reviews for book ${numericBookId}`}
        description="Paginated reviews from the Review service."
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/reviews"
          >
            Back
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Latest reviews</CardTitle>
            <CardDescription>Showing up to 20 reviews.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(paged?.content ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.customerName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.rating} / 5</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-120 truncate">
                      {r.comment ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.createdAt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!paged?.content?.length ? (
              <div className="text-muted-foreground py-6 text-sm">
                No reviews returned.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average</CardTitle>
              <CardDescription>Computed by the Review service.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-semibold">
                {(avg?.averageRating ?? 0).toFixed(2)} / 5
              </div>
              <div className="text-muted-foreground text-sm">
                {avg ? `${avg.reviewCount} reviews` : "No rating data"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add a review</CardTitle>
              <CardDescription>
                Submitting a review requires signing in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewForm bookId={numericBookId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
