import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
import { Textarea } from "~/components/ui/textarea";
import { createCategory } from "~/server/services/bookshop";

async function createCategoryAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();

  if (!name) return;

  await createCategory({
    name,
    description: description || undefined,
    color: color || undefined,
  });

  revalidatePath("/categories");
  redirect("/categories");
}

export default function NewCategoryPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="New category" description="Create a category." />

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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" name="color" placeholder="#0ea5e9" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Optional..."
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
