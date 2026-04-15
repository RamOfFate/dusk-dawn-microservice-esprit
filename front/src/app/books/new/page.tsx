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
import { createBook } from "~/server/services/bookshop";
import { getFormString } from "~/lib/form-data";

async function createBookAction(formData: FormData) {
  "use server";

  const title = getFormString(formData, "title").trim();
  const author = getFormString(formData, "author").trim();
  const priceRaw = getFormString(formData, "price").trim();
  const isbn = getFormString(formData, "isbn").trim();
  const imageUrl = getFormString(formData, "imageUrl").trim();
  const description = getFormString(formData, "description").trim();

  if (!title) {
    const params = new URLSearchParams();
    params.set("error", "Title is required.");
    if (author) params.set("author", author);
    if (priceRaw) params.set("price", priceRaw);
    if (isbn) params.set("isbn", isbn);
    if (imageUrl) params.set("imageUrl", imageUrl);
    if (description) params.set("description", description);
    redirect(`/books/new?${params.toString()}`);
  }

  try {
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
  } catch (e) {
    const params = new URLSearchParams();
    params.set(
      "error",
      e instanceof Error ? e.message : "Failed to create book",
    );
    params.set("title", title);
    if (author) params.set("author", author);
    if (priceRaw) params.set("price", priceRaw);
    if (isbn) params.set("isbn", isbn);
    if (imageUrl) params.set("imageUrl", imageUrl);
    if (description) params.set("description", description);
    redirect(`/books/new?${params.toString()}`);
  }
}

export default async function NewBookPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    title?: string;
    author?: string;
    price?: string;
    isbn?: string;
    imageUrl?: string;
    description?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <div className="space-y-8">
      <PageHeader
        title="New book"
        description="Create a book in the Bookshop service."
      />

      {sp.error ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t create book</AlertTitle>
          <AlertDescription>{sp.error}</AlertDescription>
        </Alert>
      ) : null}

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
                defaultValue={sp.title ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                name="author"
                placeholder="Andy Hunt"
                defaultValue={sp.author ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (DT)</Label>
              <Input
                id="price"
                name="price"
                inputMode="decimal"
                placeholder="19.90"
                defaultValue={sp.price ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                name="isbn"
                placeholder="978-0135957059"
                defaultValue={sp.isbn ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                placeholder="https://..."
                defaultValue={sp.imageUrl ?? ""}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Short summary..."
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
