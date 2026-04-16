"use client";

import Link from "next/link";

import { PageHeader } from "~/app/_components/page-header";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/components/auth/auth-provider";

export default function AdminHomePage() {
  const { username, roles } = useAuth();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin dashboard"
        description="Manage the Bookshop microservices through the secured API Gateway."
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href="/">
            Back to storefront
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Signed in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">User:</span> {username}
            </div>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <Badge key={r} variant="secondary">
                  {r}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              className={buttonVariants({ variant: "default" })}
              href="/admin/users"
            >
              Manage users
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Books</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              className={buttonVariants({ variant: "default" })}
              href="/admin/books"
            >
              Manage books
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href="/admin/orders"
            >
              View orders
            </Link>
            <div>
              <Link
                className={buttonVariants({ variant: "secondary" })}
                href="/admin/reviews"
              >
                View reviews
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tip</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          If the admin pages show errors, ensure you are logged in as the seeded
          admin user (<span className="font-medium">admin / admin123</span>).
        </CardContent>
      </Card>
    </div>
  );
}
