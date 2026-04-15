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
import { createBook } from "~/server/services/bookshop";

async function createBookAction(formData: FormData) {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const isbn = String(formData.get("isbn") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) return;

  await createBook({
    title,
    author: author || undefined,
    isbn: isbn || undefined,
    imageUrl: imageUrl || undefined,
    description: description || undefined,
    price: priceRaw ? Number(priceRaw) : undefined,
  });

  revalidatePath("/books");
  redirect("/books");
}

export default function NewBookPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New book"
        description="Create a book in the Bookshop service."
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Minimal fields are supported; other values are optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createBookAction} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="The Pragmatic Programmer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input id="author" name="author" placeholder="Andy Hunt" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (DT)</Label>
              <Input
                id="price"
                name="price"
                inputMode="decimal"
                placeholder="19.90"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" name="isbn" placeholder="978-0135957059" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" name="imageUrl" placeholder="https://..." />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Short summary..."
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
