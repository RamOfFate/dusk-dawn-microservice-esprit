import Link from "next/link";

import { PageHeader } from "~/app/_components/page-header";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { listUsers } from "~/server/services/users";
import { ErrorState } from "~/app/_components/error-state";

export default async function UsersPage() {
  let users: Awaited<ReturnType<typeof listUsers>> = [];

  try {
    users = await listUsers();
  } catch (e) {
    return <ErrorState error={e} title="Couldn’t load users" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        description="User Management service exposed through the gateway."
        actions={
          <Link
            className={buttonVariants({ variant: "default" })}
            href="/users/new"
          >
            New user
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>
            Passwords exist in the service model, but are not displayed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.id}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/users/${u.id}`}>Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!users.length ? (
            <div className="text-muted-foreground py-6 text-sm">
              No users returned.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
