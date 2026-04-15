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
import { listOrders } from "~/server/services/orders";

export default async function OrdersPage() {
  const orders = await listOrders();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Orders"
        description="Orders service (exposed as /candidats/orders)."
        actions={
          <Link
            className={buttonVariants({ variant: "default" })}
            href="/orders/new"
          >
            New order
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All orders</CardTitle>
          <CardDescription>Track totals and statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id}</TableCell>
                  <TableCell>{o.customerName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{o.status ?? "PENDING"}</Badge>
                  </TableCell>
                  <TableCell>{o.totalAmount.toFixed(2)} DT</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/orders/${o.id}`}>Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!orders.length ? (
            <div className="text-muted-foreground py-6 text-sm">
              No orders returned.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
