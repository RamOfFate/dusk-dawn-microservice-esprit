import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { PageHeader } from "~/app/_components/page-header";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
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
import { createCategory } from "~/server/services/bookshop";
import { getFormString } from "~/lib/form-data";

async function createCategoryAction(formData: FormData) {
  "use server";

  const name = getFormString(formData, "name").trim();
  const description = getFormString(formData, "description").trim();
  const color = getFormString(formData, "color").trim();

  if (!name) {
    const params = new URLSearchParams();
    params.set("error", "Category name is required.");
    if (color) params.set("color", color);
    if (description) params.set("description", description);
    redirect(`/categories/new?${params.toString()}`);
  }

  try {
    await createCategory({
      name,
      description: description || undefined,
      color: color || undefined,
    });

    revalidatePath("/categories");
    redirect("/categories");
  } catch (e) {
    const params = new URLSearchParams();
    params.set(
      "error",
      e instanceof Error ? e.message : "Failed to create category",
    );
    params.set("name", name);
    if (color) params.set("color", color);
    if (description) params.set("description", description);
    redirect(`/categories/new?${params.toString()}`);
  }
}

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    name?: string;
    color?: string;
    description?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <div className="space-y-8">
      <PageHeader title="New category" description="Create a category." />

      {sp.error ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t create category</AlertTitle>
          <AlertDescription>{sp.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Stored in Mongo via the Bookshop service.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={createCategoryAction}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Science Fiction"
                required
                defaultValue={sp.name ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                name="color"
                placeholder="#0ea5e9"
                defaultValue={sp.color ?? ""}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Optional..."
                defaultValue={sp.description ?? ""}
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
