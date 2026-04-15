import { revalidatePath } from "next/cache";
import Link from "next/link";

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

async function createReviewAction(bookId: number, formData: FormData) {
  "use server";

  const userIdRaw = String(formData.get("userId") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();

  const rating = Number(ratingRaw);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return;

  await createReview({
    bookId,
    userId: userIdRaw ? Number(userIdRaw) : undefined,
    rating,
    comment: comment || undefined,
  });

  revalidatePath(`/reviews/book/${bookId}`);
}

export default async function ReviewsByBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const numericBookId = Number(bookId);

  const [avg, paged] = await Promise.all([
    getAverageRating(numericBookId),
    listReviewsByBook(numericBookId, { sort: "latest", page: 0, size: 20 }),
  ]);

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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    name="comment"
                    placeholder="Optional..."
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
