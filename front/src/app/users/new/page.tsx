import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { PageHeader } from "~/app/_components/page-header";
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
import { createUser } from "~/server/services/users";

async function createUserAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !role || !password) return;

  await createUser({ name, email, role, password });
  revalidatePath("/users");
  redirect("/users");
}

export default function NewUserPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New user"
        description="Create a user in the User service."
      />

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
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" name="role" placeholder="USER" required />
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
