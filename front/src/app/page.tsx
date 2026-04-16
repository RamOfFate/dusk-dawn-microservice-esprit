import Link from "next/link";

import { BookCover } from "~/app/_components/book-cover";
import { CategoryBadge } from "~/app/_components/category-badge";
import { ErrorState } from "~/app/_components/error-state";
import { PageHeader } from "~/app/_components/page-header";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { listCategories, listPopularBooks } from "~/server/services/bookshop";

export default async function Home() {
  let popular: Awaited<ReturnType<typeof listPopularBooks>> = [];
  let categories: Awaited<ReturnType<typeof listCategories>> = [];

  try {
    [popular, categories] = await Promise.all([
      listPopularBooks(),
      listCategories(),
    ]);
  } catch (e) {
    return <ErrorState error={e} title="Couldn’t load the shop" />;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <PageHeader
          title="Discover your next read"
          description="Browse the catalog, check ratings, and run a quick checkout through the microservices gateway."
          actions={
            <div className="flex items-center gap-2">
              <Link
                className={buttonVariants({ variant: "default" })}
                href="/books"
              >
                Browse books
              </Link>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="/search"
              >
                Search
              </Link>
            </div>
          }
        />

        {categories.length ? (
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 8).map((c) => (
              <CategoryBadge
                key={String(c.id)}
                category={c}
                href={`/books?categoryId=${encodeURIComponent(String(c.id))}`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Popular right now</CardTitle>
              <CardDescription>
                Top-rated books (bookshop-service uses review-service ratings).
              </CardDescription>
            </div>
            <Badge variant="outline">Top {popular.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((b) => (
              <Card key={b.id} className="overflow-hidden">
                <BookCover
                  title={b.title}
                  imageUrl={b.imageUrl}
                  fallbackColor={b.category?.color}
                />
                <CardHeader>
                  <CardTitle className="line-clamp-1">{b.title}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {b.author ?? "Unknown author"}
                  </CardDescription>
                  {b.category ? (
                    <div className="pt-1">
                      <CategoryBadge category={b.category} />
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-muted-foreground text-sm">
                    {b.price != null ? `${b.price.toFixed(2)} DT` : "Price N/A"}
                  </div>
                  <Link
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    href={`/books/${encodeURIComponent(b.id)}`}
                  >
                    Details
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {!popular.length ? (
            <div className="text-muted-foreground pt-4 text-sm">
              No popular books returned yet.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
