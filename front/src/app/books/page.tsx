import Link from "next/link";

import { ErrorState } from "~/app/_components/error-state";
import { BookCover } from "~/app/_components/book-cover";
import { CategoryBadge } from "~/app/_components/category-badge";
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
import {
  listBooks,
  listCategories,
  listPopularBooks,
} from "~/server/services/bookshop";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const { categoryId } = await searchParams;
  const selectedCategoryId = categoryId?.trim() ?? "";

  let popular: Awaited<ReturnType<typeof listPopularBooks>> = [];
  let books: Awaited<ReturnType<typeof listBooks>> = [];
  let categories: Awaited<ReturnType<typeof listCategories>> = [];

  try {
    [popular, books, categories] = await Promise.all([
      listPopularBooks(),
      listBooks(),
      listCategories(),
    ]);
  } catch (e) {
    return <ErrorState error={e} title="Couldn’t load books" />;
  }

  const filteredBooks = selectedCategoryId
    ? books.filter((b) => String(b.category?.id ?? "") === selectedCategoryId)
    : books;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Books"
        description="Browse all books and the top-rated selection."
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/search"
          >
            Search
          </Link>
        }
      />

      {categories.length ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Filter by category</div>
              <div className="text-muted-foreground text-xs">
                Click a badge to filter the list.
              </div>
            </div>
            {selectedCategoryId ? (
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href="/books"
              >
                Clear
              </Link>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <CategoryBadge
              category={{ id: "", name: "All", color: null, description: null }}
              href="/books"
              active={!selectedCategoryId}
            />
            {categories.map((c) => (
              <CategoryBadge
                key={String(c.id)}
                category={c}
                href={`/books?categoryId=${encodeURIComponent(String(c.id))}`}
                active={String(c.id) === selectedCategoryId}
              />
            ))}
          </div>
        </section>
      ) : null}

      {popular.length ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Popular</h2>
            <Badge variant="secondary">Top {popular.length}</Badge>
          </div>
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
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/books/${encodeURIComponent(b.id)}`}>
                      Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">All books</h2>
          <Badge variant="outline">{filteredBooks.length}</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((b) => (
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
                <Button asChild variant="outline" size="sm">
                  <Link href={`/books/${encodeURIComponent(b.id)}`}>
                    Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {!filteredBooks.length ? (
          <Card>
            <CardHeader>
              <CardTitle>No books returned</CardTitle>
              <CardDescription>
                {selectedCategoryId
                  ? "No books match this category."
                  : "Make sure the gateway is running and reachable."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link className={buttonVariants({ variant: "outline" })} href="/">
                Back home
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
