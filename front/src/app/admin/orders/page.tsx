"use client";

import * as React from "react";
import Link from "next/link";

import { PageHeader } from "~/app/_components/page-header";
import { ErrorState } from "~/app/_components/error-state";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAuth } from "~/components/auth/auth-provider";
import { gatewayDelete, gatewayGet, gatewayPut } from "~/lib/gateway-client";

type Order = {
  id: number;
  customerName: string;
  orderDate?: string | null;
  status?: string | null;
  totalAmount: number;
};

export default function AdminOrdersPage() {
  const { token } = useAuth();

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [updatingId, setUpdatingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void gatewayGet<Order[]>("/orders", token)
      .then((data) => {
        if (cancelled) return;
        setOrders(data ?? []);
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
  }, [token]);

  async function setStatus(id: number, status: "DELIVERED" | "CANCELLED") {
    setUpdatingId(id);
    setError(null);

    try {
      const updated = await gatewayPut<Order>(`/orders/${id}`, { status }, token);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                status: (updated?.status ?? status) as Order["status"],
              }
            : o,
        ),
      );
    } catch (e) {
      setError(e);
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteOrder(id: number) {
    const ok = window.confirm("Delete this order? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    setError(null);

    try {
      await gatewayDelete(`/orders/${id}`, token);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      setError(e);
    } finally {
      setDeletingId(null);
    }
  }

  if (error)
    return (
      <ErrorState
        error={error}
        title="Couldn’t load orders"
        homeHref="/admin"
      />
    );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Orders"
        description="Order management service exposed through the gateway."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/admin/orders/new">New order</Link>
            </Button>
            <Badge variant="outline">Admin</Badge>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All orders</CardTitle>
          <CardDescription>Totals and statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground py-6 text-sm">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.id}</TableCell>
                    <TableCell>{o.customerName}</TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-2">
                        <Badge variant="secondary">{o.status ?? "PENDING"}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === o.id}
                            >
                              {updatingId === o.id ? "Updating…" : "Set status"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem
                              onClick={() => void setStatus(o.id, "DELIVERED")}
                            >
                              Mark DELIVERED
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => void setStatus(o.id, "CANCELLED")}
                            >
                              Mark CANCELLED
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {o.totalAmount.toFixed(2)} DT
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/orders/${o.id}`}>Edit</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          disabled={deletingId === o.id}
                          onClick={() => void deleteOrder(o.id)}
                        >
                          {deletingId === o.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && !orders.length ? (
            <div className="text-muted-foreground py-6 text-sm">
              No orders returned.
            </div>
          ) : null}

          <div className="mt-6 flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
