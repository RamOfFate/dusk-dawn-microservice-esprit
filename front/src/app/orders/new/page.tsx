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
import { createOrder } from "~/server/services/orders";

async function createOrderAction(formData: FormData) {
  "use server";

  const customerName = String(formData.get("customerName") ?? "").trim();
  const totalAmountRaw = String(formData.get("totalAmount") ?? "").trim();

  if (!customerName || !totalAmountRaw) return;

  await createOrder({
    customerName,
    totalAmount: Number(totalAmountRaw),
  });

  revalidatePath("/orders");
  redirect("/orders");
}

export default function NewOrderPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="New order" description="Create an order." />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            The service accepts customer name and total amount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={createOrderAction}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer name</Label>
              <Input id="customerName" name="customerName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total amount (DT)</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                inputMode="decimal"
                required
              />
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
