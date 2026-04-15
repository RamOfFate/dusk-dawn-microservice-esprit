import Link from "next/link";

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
import { listCategories } from "~/server/services/bookshop";

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Categories"
        description="Categories from the Bookshop service."
        actions={
          <Link
            className={buttonVariants({ variant: "default" })}
            href="/categories/new"
          >
            New category
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="line-clamp-1">{c.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {c.description ?? "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge variant="outline">{c.id}</Badge>
              {c.color ? <Badge variant="secondary">{c.color}</Badge> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
