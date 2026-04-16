import { notFound } from "next/navigation";

import { ErrorState } from "~/app/_components/error-state";
import { listBooks } from "~/server/services/bookshop";
import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let books: Awaited<ReturnType<typeof listBooks>> = [];
  try {
    books = await listBooks();
  } catch (e) {
    return <ErrorState error={e} title="Couldn’t load checkout" />;
  }

  const book = books.find((b) => String(b.id) === id);
  if (!book) notFound();

  return <CheckoutClient book={book} />;
}
