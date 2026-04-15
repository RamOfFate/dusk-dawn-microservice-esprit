import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

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
import {
  createReview,
  getAverageRating,
  listReviewsByBook,
} from "~/server/services/reviews";
import { ErrorState } from "~/app/_components/error-state";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { getFormString } from "~/lib/form-data";

async function createReviewAction(bookId: number, formData: FormData) {
  "use server";

  const userIdRaw = getFormString(formData, "userId").trim();
  const ratingRaw = getFormString(formData, "rating").trim();
  const comment = getFormString(formData, "comment").trim();

  const rating = Number(ratingRaw);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    const params = new URLSearchParams();
    params.set("error", "Rating must be a number between 1 and 5.");
    if (userIdRaw) params.set("userId", userIdRaw);
    if (comment) params.set("comment", comment);
    params.set("rating", ratingRaw);
    redirect(`/reviews/book/${bookId}?${params.toString()}`);
  }

  try {
    await createReview({
      bookId,
      userId: userIdRaw ? Number(userIdRaw) : undefined,
      rating,
      comment: comment || undefined,
    });
    revalidatePath(`/reviews/book/${bookId}`);
  } catch (e) {
    const params = new URLSearchParams();
    params.set(
      "error",
      e instanceof Error ? e.message : "Failed to submit review",
    );
    if (userIdRaw) params.set("userId", userIdRaw);
    if (comment) params.set("comment", comment);
    params.set("rating", String(rating));
    redirect(`/reviews/book/${bookId}?${params.toString()}`);
  }
}

export default async function ReviewsByBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{
    error?: string;
    userId?: string;
    rating?: string;
    comment?: string;
  }>;
}) {
  const { bookId } = await params;
  const sp = await searchParams;
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
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(paged?.content ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.userId}</TableCell>
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
                This endpoint may require authentication depending on service
                security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sp.error ? (
                <Alert variant="destructive" className="mb-3">
                  <AlertTitle>Couldn’t submit review</AlertTitle>
                  <AlertDescription>{sp.error}</AlertDescription>
                </Alert>
              ) : null}
              <form
                action={createReviewAction.bind(null, numericBookId)}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID (optional)</Label>
                  <Input
                    id="userId"
                    name="userId"
                    inputMode="numeric"
                    placeholder="e.g. 1"
                    defaultValue={sp.userId ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Input
                    id="rating"
                    name="rating"
                    inputMode="numeric"
                    placeholder="5"
                    required
                    defaultValue={sp.rating ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    name="comment"
                    placeholder="Optional..."
                    defaultValue={sp.comment ?? ""}
                  />
                </div>
                <Button type="submit">Submit</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
