import Link from "next/link";

import { buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default function NotFound() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Not found</CardTitle>
        <CardDescription>The requested page does not exist.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link className={buttonVariants({ variant: "outline" })} href="/">
          Go home
        </Link>
      </CardContent>
    </Card>
  );
}
