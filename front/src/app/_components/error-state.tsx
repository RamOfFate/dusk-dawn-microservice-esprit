import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getFriendlyError } from "~/lib/friendly-error";

export function ErrorState({
  error,
  title,
  homeHref = "/",
}: {
  error: unknown;
  title?: string;
  homeHref?: string;
}) {
  const friendly = getFriendlyError(error);

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTitle>{title ?? friendly.title}</AlertTitle>
        <AlertDescription>
          <p>{friendly.message}</p>
          {friendly.hint ? <p className="mt-2">{friendly.hint}</p> : null}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>What you can do</CardTitle>
          <CardDescription>
            This UI calls your microservices through the API Gateway.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href={homeHref}>Go to home</Link>
          </Button>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/books"
          >
            Browse books
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
