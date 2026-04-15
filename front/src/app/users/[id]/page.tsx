import Link from "next/link";
import { notFound } from "next/navigation";

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
import { getUserById } from "~/server/services/users";

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const user = await getUserById(numericId);
  if (!user) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/users"
          >
            Back
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              User details from the User service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">User ID:</span> {user.id}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Role:</span>{" "}
              <Badge variant="secondary">{user.role}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related</CardTitle>
            <CardDescription>
              Jump to other services using this user ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/carts?customerId=${user.id}`}
            >
              View carts
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/orders"
            >
              View orders
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
