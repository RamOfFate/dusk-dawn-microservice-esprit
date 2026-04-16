"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
import { gatewayPost } from "~/lib/gateway-client";

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type CreateOrderBody = {
  customerName: string;
  orderDate: string;
  status: string;
  totalAmount: number;
};

export default function AdminCreateOrderPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [form, setForm] = React.useState<CreateOrderBody>(() => ({
    customerName: "",
    orderDate: toDatetimeLocalValue(new Date()),
    status: "PENDING",
    totalAmount: 0,
  }));

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await gatewayPost("/orders", form, token);
      router.push("/admin/orders");
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Couldn’t create order"
        homeHref="/admin/orders"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create order"
        description="Create a new order via the Orders service (through the gateway)."
        actions={<Badge variant="outline">Admin</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Status must be one of: PENDING, CONFIRMED, SHIPPED, DELIVERED,
            CANCELLED.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="customerName">Customer name</Label>
                <Input
                  id="customerName"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerName: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderDate">Order date</Label>
                <Input
                  id="orderDate"
                  type="datetime-local"
                  value={form.orderDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, orderDate: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
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
                  value={String(form.totalAmount)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      totalAmount: Number(e.target.value),
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/orders">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
