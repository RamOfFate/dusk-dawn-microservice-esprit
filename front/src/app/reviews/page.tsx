import Link from "next/link";

import { PageHeader } from "~/app/_components/page-header";
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

export default async function ReviewsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ bookId?: string }>;
}) {
  const { bookId } = await searchParams;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reviews"
        description="Review service uses numeric book IDs (Long)."
      />

      <Card>
        <CardHeader>
          <CardTitle>Open a book’s reviews</CardTitle>
          <CardDescription>
            Enter a numeric book ID to browse reviews and averages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="bookId">Book ID (numeric)</Label>
              <Input
                id="bookId"
                name="bookId"
                inputMode="numeric"
                placeholder="e.g. 1"
                defaultValue={bookId ?? ""}
              />
            </div>
            <Button type="submit" variant="secondary">
              Go
            </Button>
            {bookId ? (
              <Button asChild>
                <Link href={`/reviews/book/${bookId}`}>Open</Link>
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
