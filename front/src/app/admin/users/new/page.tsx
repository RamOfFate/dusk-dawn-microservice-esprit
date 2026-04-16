"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
import { gatewayPost } from "~/lib/gateway-client";

type CreateUserBody = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export default function AdminCreateUserPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [form, setForm] = React.useState<CreateUserBody>({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await gatewayPost("/users", form, token);
      router.push("/admin/users");
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Couldn’t create user"
        homeHref="/admin/users"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create user"
        description="Create a new user via the User microservice (through the gateway)."
        actions={<Badge variant="outline">Admin</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Password is only used on create (updates ignore it).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                  placeholder="admin | customer"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/users">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
