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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { listCarts, listCartsByCustomer } from "~/server/services/carts";
import { ErrorState } from "~/app/_components/error-state";

export default async function CartsPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const customerIdNum = customerId ? Number(customerId) : undefined;
  const activeCustomerId =
    customerIdNum !== undefined && Number.isFinite(customerIdNum)
      ? customerIdNum
      : undefined;
  let carts: Awaited<ReturnType<typeof listCarts>> = [];

  try {
    if (activeCustomerId !== undefined) {
      carts = await listCartsByCustomer(activeCustomerId);
    } else {
      carts = await listCarts();
    }
  } catch (e) {
    return <ErrorState error={e} title="Couldn’t load carts" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Carts"
        description="Cart & Payment service. This service models carts (not individual cart items)."
        actions={
          <Link
            className={buttonVariants({ variant: "default" })}
            href="/carts/new"
          >
            New cart
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>
            Optionally filter carts by customer ID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID</Label>
              <Input
                id="customerId"
                name="customerId"
                defaultValue={customerId ?? ""}
                placeholder="e.g. 1"
                inputMode="numeric"
              />
            </div>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
            <Link
              className={buttonVariants({ variant: "ghost" })}
              href="/carts"
            >
              Clear
            </Link>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>
            {activeCustomerId !== undefined
              ? `Carts for customer ${activeCustomerId}`
              : "All carts"}
          </CardTitle>
          <CardDescription>
            Data from the CartManagement service.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.id}</TableCell>
                  <TableCell>
                    {c.customerId != null ? (
                      <Badge variant="secondary">{c.customerId}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.totalAmount != null
                      ? `${c.totalAmount.toFixed(2)} DT`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.createdAt ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.updatedAt ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!carts.length ? (
            <div className="text-muted-foreground py-6 text-sm">
              No carts returned.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
