import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { PageHeader } from "~/app/_components/page-header";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createUser } from "~/server/services/users";
import { getFormString } from "~/lib/form-data";

async function createUserAction(formData: FormData) {
  "use server";

  const name = getFormString(formData, "name").trim();
  const email = getFormString(formData, "email").trim();
  const role = getFormString(formData, "role").trim();
  const password = getFormString(formData, "password");

  if (!name || !email || !role || !password) {
    const params = new URLSearchParams();
    params.set("error", "Please fill in all fields.");
    if (name) params.set("name", name);
    if (email) params.set("email", email);
    if (role) params.set("role", role);
    redirect(`/users/new?${params.toString()}`);
  }

  try {
    await createUser({ name, email, role, password });
    revalidatePath("/users");
    redirect("/users");
  } catch (e) {
    const params = new URLSearchParams();
    params.set(
      "error",
      e instanceof Error ? e.message : "Failed to create user",
    );
    params.set("name", name);
    params.set("email", email);
    params.set("role", role);
    redirect(`/users/new?${params.toString()}`);
  }
}

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    name?: string;
    email?: string;
    role?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <div className="space-y-8">
      <PageHeader
        title="New user"
        description="Create a user in the User service."
      />

      {sp.error ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t create user</AlertTitle>
          <AlertDescription>{sp.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            This service stores credentials in its model. Use only for
            demo/testing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={sp.name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={sp.email ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                name="role"
                placeholder="USER"
                required
                defaultValue={sp.role ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
