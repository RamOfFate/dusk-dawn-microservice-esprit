"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "~/app/_components/page-header";
import { ErrorState } from "~/app/_components/error-state";
import { useAuth } from "~/components/auth/auth-provider";
import { Badge } from "~/components/ui/badge";
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
import { gatewayDelete, gatewayGet, gatewayPut } from "~/lib/gateway-client";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function AdminEditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();

  const userIdRaw = params?.id;
  const userId = typeof userIdRaw === "string" ? Number(userIdRaw) : NaN;

  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  React.useEffect(() => {
    if (!Number.isFinite(userId) || userId <= 0) {
      setLoading(false);
      setError(new Error("Invalid user id"));
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void gatewayGet<User>(`/users/${userId}`, token)
      .then((data) => {
        if (cancelled) return;
        if (!data) throw new Error("User not found");
        setUser(data);
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
  }, [token, userId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const body = { name: user.name, email: user.email, role: user.role };
      await gatewayPut(`/users/${userId}`, body, token);
      router.push("/admin/users");
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!Number.isFinite(userId) || userId <= 0) return;
    const ok = window.confirm("Delete this user? This cannot be undone.");
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      await gatewayDelete(`/users/${userId}`, token);
      router.push("/admin/users");
    } catch (err) {
      setError(err);
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Couldn’t load user"
        homeHref="/admin/users"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={loading ? "Edit user" : `Edit user #${user?.id ?? userId}`}
        description="Update user fields (name/email/role)."
        actions={<Badge variant="outline">Admin</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Password updates are not supported by this backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || !user ? (
            <div className="text-muted-foreground py-6 text-sm">Loading…</div>
          ) : (
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={user.name}
                    onChange={(e) =>
                      setUser((u) => (u ? { ...u, name: e.target.value } : u))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={user.role}
                    onChange={(e) =>
                      setUser((u) => (u ? { ...u, role: e.target.value } : u))
                    }
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    onChange={(e) =>
                      setUser((u) => (u ? { ...u, email: e.target.value } : u))
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/admin/users">Cancel</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive"
                  disabled={deleting}
                  onClick={() => void onDelete()}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
