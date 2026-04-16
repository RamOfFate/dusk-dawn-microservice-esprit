import Link from "next/link";

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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { apiGet } from "~/server/api-client";

type SearchItem = {
  bookId: string;
  title: string;
  author?: string | null;
  description?: string | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  price?: number | null;
};

type SearchResponse = {
  query: string;
  results: SearchItem[];
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; limit?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const limitRaw = (sp.limit ?? "20").trim();
  const limit = Math.max(1, Math.min(50, Number(limitRaw) || 20));

  let data: SearchResponse | null = null;

  try {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("limit", String(limit));
    data = await apiGet<SearchResponse>(`/search?${params.toString()}`);
  } catch (e) {
    return <ErrorState error={e} title="Search is unavailable" />;
  }

  const results = data?.results ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Search"
        description="Powered by the recommendation-search-service (Mongo text search index)."
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/books"
          >
            Browse catalog
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Find books</CardTitle>
          <CardDescription>Type a query and press enter.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="q">Query</Label>
              <Input
                id="q"
                name="q"
                placeholder="e.g. clean code"
                defaultValue={q}
              />
            </div>
            <Input type="hidden" name="limit" value={String(limit)} />
            <div>
              <button className={buttonVariants({ variant: "secondary" })}>
                Search
              </button>
            </div>
          </form>

          <Separator className="my-6" />

          <div className="flex items-center justify-between gap-3">
            <div className="text-muted-foreground text-sm">
              {q ? (
                <>
                  Showing results for <span className="font-medium">{q}</span>
                </>
              ) : (
                <>Showing latest indexed books</>
              )}
            </div>
            <Badge variant="outline">{results.length}</Badge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <Card key={r.bookId} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{r.title}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {r.author ?? "Unknown author"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {r.categoryName ? (
                      <Badge variant="secondary">{r.categoryName}</Badge>
                    ) : (
                      <Badge variant="outline">No category</Badge>
                    )}
                    {r.price != null ? (
                      <Badge variant="outline">{r.price.toFixed(2)} DT</Badge>
                    ) : null}
                  </div>

                  {r.description ? (
                    <div className="text-muted-foreground line-clamp-3 text-sm">
                      {r.description}
                    </div>
                  ) : null}

                  <Link
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    href={`/books/${encodeURIComponent(r.bookId)}`}
                  >
                    Details
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {!results.length ? (
            <div className="text-muted-foreground pt-6 text-sm">
              No matches.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
