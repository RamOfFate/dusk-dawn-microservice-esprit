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
import { Separator } from "~/components/ui/separator";
import { listBooks, listPopularBooks } from "~/server/services/bookshop";
import { ErrorState } from "~/app/_components/error-state";

export default async function BooksPage() {
  let popular: Awaited<ReturnType<typeof listPopularBooks>> = [];
  let books: Awaited<ReturnType<typeof listBooks>> = [];

  try {
    [popular, books] = await Promise.all([listPopularBooks(), listBooks()]);
  } catch (e) {
    return <ErrorState error={e} title="Couldn’t load books" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Books"
        description="Browse all books and the most viewed (popular) selection."
        actions={
          <Link
            className={buttonVariants({ variant: "default" })}
            href="/books/new"
          >
            New book
          </Link>
        }
      />

      {popular.length ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Popular</h2>
            <Badge variant="secondary">Top {popular.length}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((b) => (
              <Card key={b.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{b.title}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {b.author ?? "Unknown author"}
                  </CardDescription>
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
          <Badge variant="outline">{books.length}</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <Card key={b.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="line-clamp-1">{b.title}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {b.category?.name
                    ? `Category: ${b.category.name}`
                    : "No category"}
                </CardDescription>
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

        {!books.length ? (
          <Card>
            <CardHeader>
              <CardTitle>No books returned</CardTitle>
              <CardDescription>
                Make sure the gateway is running and reachable.
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
