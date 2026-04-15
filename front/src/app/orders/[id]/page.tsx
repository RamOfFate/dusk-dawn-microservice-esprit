import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "~/app/_components/page-header";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getOrderById } from "~/server/services/orders";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const order = await getOrderById(numericId);
  if (!order) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Order #${order.id}`}
        description={order.customerName}
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/orders"
          >
            Back
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Order details from the Orders service.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground text-xs">Status</div>
            <Badge variant="secondary">{order.status ?? "PENDING"}</Badge>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Total amount</div>
            <div className="text-lg font-semibold">
              {order.totalAmount.toFixed(2)} DT
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-muted-foreground text-xs">Order date</div>
            <div className="text-sm">{order.orderDate ?? "—"}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
