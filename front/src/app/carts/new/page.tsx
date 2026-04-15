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
import { Textarea } from "~/components/ui/textarea";
import { createCart } from "~/server/services/carts";

async function createCartAction(formData: FormData) {
  "use server";

  const customerIdRaw = String(formData.get("customerId") ?? "").trim();
  const totalAmountRaw = String(formData.get("totalAmount") ?? "").trim();
  const shippingAddress = String(formData.get("shippingAddress") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  await createCart({
    customerId: customerIdRaw ? Number(customerIdRaw) : null,
    totalAmount: totalAmountRaw ? Number(totalAmountRaw) : null,
    shippingAddress: shippingAddress || null,
    notes: notes || null,
  });

  revalidatePath("/carts");
  redirect("/carts");
}

export default function NewCartPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="New cart" description="Create a cart." />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            The service stores a cart header (customer, totals, address).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCartAction} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID</Label>
              <Input id="customerId" name="customerId" inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total amount (DT)</Label>
              <Input id="totalAmount" name="totalAmount" inputMode="decimal" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="shippingAddress">Shipping address</Label>
              <Input id="shippingAddress" name="shippingAddress" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
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
