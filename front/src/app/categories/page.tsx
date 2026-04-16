import Link from "next/link";

import { ErrorState } from "~/app/_components/error-state";
import { CategoryBadge } from "~/app/_components/category-badge";
import { PageHeader } from "~/app/_components/page-header";
import { buttonVariants } from "~/components/ui/button";
import { listCategories } from "~/server/services/bookshop";

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof listCategories>> = [];

  try {
    categories = await listCategories();
  } catch (e) {
    return <ErrorState error={e} title="Couldn’t load categories" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Categories"
        description="Click a category badge to filter the books list."
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/books"
          >
            Browse books
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <CategoryBadge
            key={String(c.id)}
            category={c}
            href={`/books?categoryId=${encodeURIComponent(String(c.id))}`}
          />
        ))}
      </div>

      {!categories.length ? (
        <div className="text-muted-foreground text-sm">No categories yet.</div>
      ) : null}
    </div>
  );
}
