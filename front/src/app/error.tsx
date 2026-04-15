"use client";

import Link from "next/link";

import { ErrorState } from "~/app/_components/error-state";
import { Button } from "~/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Bookshop</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => reset()}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>

      <ErrorState error={error} />
    </div>
  );
}
