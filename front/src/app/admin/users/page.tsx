"use client";

import * as React from "react";
import Link from "next/link";

import { PageHeader } from "~/app/_components/page-header";
import { ErrorState } from "~/app/_components/error-state";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
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
import { useAuth } from "~/components/auth/auth-provider";
import { gatewayDelete, gatewayGet } from "~/lib/gateway-client";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function AdminUsersPage() {
  const { token } = useAuth();

  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void gatewayGet<User[]>("/users", token)
      .then((data) => {
        if (cancelled) return;
        setUsers(data ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function deleteUser(id: number) {
    const ok = window.confirm("Delete this user? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    setError(null);

    try {
      await gatewayDelete(`/users/${id}`, token);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      setError(e);
    } finally {
      setDeletingId(null);
    }
  }

  if (error)
    return (
      <ErrorState error={error} title="Couldn’t load users" homeHref="/admin" />
    );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        description="User microservice (secured) exposed through the gateway."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/admin/users/new">New user</Link>
            </Button>
            <Badge variant="outline">Admin</Badge>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>Requires Keycloak admin role.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground py-6 text-sm">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      <div className="inline-flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/users/${u.id}`}>Edit</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          disabled={deletingId === u.id}
                          onClick={() => void deleteUser(u.id)}
                        >
                          {deletingId === u.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && !users.length ? (
            <div className="text-muted-foreground py-6 text-sm">
              No users returned.
            </div>
          ) : null}

          <div className="mt-6 flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
