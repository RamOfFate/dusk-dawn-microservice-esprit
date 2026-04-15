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
import { Textarea } from "~/components/ui/textarea";
import { createCart } from "~/server/services/carts";
import { getFormString } from "~/lib/form-data";

async function createCartAction(formData: FormData) {
  "use server";

  const customerIdRaw = getFormString(formData, "customerId").trim();
  const totalAmountRaw = getFormString(formData, "totalAmount").trim();
  const shippingAddress = getFormString(formData, "shippingAddress").trim();
  const notes = getFormString(formData, "notes").trim();

  try {
    await createCart({
      customerId: customerIdRaw ? Number(customerIdRaw) : null,
      totalAmount: totalAmountRaw ? Number(totalAmountRaw) : null,
      shippingAddress: shippingAddress || null,
      notes: notes || null,
    });

    revalidatePath("/carts");
    redirect("/carts");
  } catch (e) {
    const params = new URLSearchParams();
    params.set(
      "error",
      e instanceof Error ? e.message : "Failed to create cart",
    );
    if (customerIdRaw) params.set("customerId", customerIdRaw);
    if (totalAmountRaw) params.set("totalAmount", totalAmountRaw);
    if (shippingAddress) params.set("shippingAddress", shippingAddress);
    if (notes) params.set("notes", notes);
    redirect(`/carts/new?${params.toString()}`);
  }
}

export default async function NewCartPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    customerId?: string;
    totalAmount?: string;
    shippingAddress?: string;
    notes?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <div className="space-y-8">
      <PageHeader
        title="New cart"
        description="Create a cart header (customer, totals, address)."
      />

      {sp.error ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t create cart</AlertTitle>
          <AlertDescription>{sp.error}</AlertDescription>
        </Alert>
      ) : null}

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
              <Input
                id="customerId"
                name="customerId"
                inputMode="numeric"
                defaultValue={sp.customerId ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total amount (DT)</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                inputMode="decimal"
                defaultValue={sp.totalAmount ?? ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="shippingAddress">Shipping address</Label>
              <Input
                id="shippingAddress"
                name="shippingAddress"
                defaultValue={sp.shippingAddress ?? ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={sp.notes ?? ""} />
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
