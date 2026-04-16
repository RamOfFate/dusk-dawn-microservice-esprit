"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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
import { gatewayDelete, gatewayGet, gatewayPut } from "~/lib/gateway-client";

type Order = {
  id: number;
  customerName: string;
  orderDate: string;
  status?: string | null;
  totalAmount: number;
};

function normalizeDatetimeLocal(value: string) {
  // Accept ISO-ish strings like "2026-04-16T12:34:56" or "2026-04-16T12:34"
  if (!value) return "";
  return value.length >= 16 ? value.slice(0, 16) : value;
}

export default function AdminEditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();

  const orderIdRaw = params?.id;
  const orderId = typeof orderIdRaw === "string" ? Number(orderIdRaw) : NaN;

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  React.useEffect(() => {
    if (!Number.isFinite(orderId) || orderId <= 0) {
      setLoading(false);
      setError(new Error("Invalid order id"));
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void gatewayGet<Order>(`/orders/${orderId}`, token)
      .then((data) => {
        if (cancelled) return;
        if (!data) throw new Error("Order not found");
        setOrder({
          ...data,
          orderDate: normalizeDatetimeLocal(data.orderDate),
          status: data.status ?? "PENDING",
        });
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
  }, [token, orderId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;

    setSaving(true);
    setError(null);

    try {
      const body = {
        customerName: order.customerName,
        orderDate: order.orderDate,
        status: order.status ?? "PENDING",
        totalAmount: order.totalAmount,
      };
      await gatewayPut(`/orders/${orderId}`, body, token);
      router.push("/admin/orders");
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!Number.isFinite(orderId) || orderId <= 0) return;
    const ok = window.confirm("Delete this order? This cannot be undone.");
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      await gatewayDelete(`/orders/${orderId}`, token);
      router.push("/admin/orders");
    } catch (err) {
      setError(err);
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Couldn’t load order"
        homeHref="/admin/orders"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={loading ? "Edit order" : `Edit order #${order?.id ?? orderId}`}
        description="Update order fields."
        actions={<Badge variant="outline">Admin</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Order</CardTitle>
          <CardDescription>
            Status must be one of: PENDING, CONFIRMED, SHIPPED, DELIVERED,
            CANCELLED.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || !order ? (
            <div className="text-muted-foreground py-6 text-sm">Loading…</div>
          ) : (
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="customerName">Customer name</Label>
                  <Input
                    id="customerName"
                    value={order.customerName}
                    onChange={(e) =>
                      setOrder((o) =>
                        o ? { ...o, customerName: e.target.value } : o,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderDate">Order date</Label>
                  <Input
                    id="orderDate"
                    type="datetime-local"
                    value={order.orderDate}
                    onChange={(e) =>
                      setOrder((o) =>
                        o ? { ...o, orderDate: e.target.value } : o,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={order.status ?? "PENDING"}
                    onChange={(e) =>
                      setOrder((o) =>
                        o ? { ...o, status: e.target.value } : o,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="totalAmount">Total amount</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    value={String(order.totalAmount)}
                    onChange={(e) =>
                      setOrder((o) =>
                        o ? { ...o, totalAmount: Number(e.target.value) } : o,
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/admin/orders">Cancel</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive"
                  disabled={deleting}
                  onClick={() => void onDelete()}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
