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
import { useAuth } from "~/components/auth/auth-provider";
import { gatewayGet } from "~/lib/gateway-client";

type Order = {
  id: number;
  customerName: string;
  orderDate?: string | null;
  status?: string | null;
  totalAmount?: number | null;
  shippingAddress?: string | null;
  notes?: string | null;
};

function money(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)} DT`;
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function OrdersPage() {
  const { initialized, isAuthenticated, login, token, username } = useAuth();
  const customerName = username?.trim() ?? "";

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  const refresh = React.useCallback(() => {
    if (!token) return;
    if (!customerName) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const encoded = encodeURIComponent(customerName);

    void gatewayGet<Order[]>(`/orders/customerName/${encoded}`, token)
      .then((data) => {
        if (cancelled) return;
        const list = (data ?? []).slice();
        // best-effort newest-first
        list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        setOrders(list);
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
  }, [token, customerName]);

  React.useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) return;
    if (!customerName) return;

    const cleanup = refresh();
    return cleanup;
  }, [initialized, isAuthenticated, customerName, refresh]);

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Couldn’t load orders"
        homeHref="/books"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My orders"
        description="View the status of your previous orders."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={!isAuthenticated || loading || !customerName}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
            <Badge variant="outline">{customerName || "Customer"}</Badge>
          </div>
        }
      />

      {!initialized ? (
        <div className="text-muted-foreground py-6 text-sm">Loading…</div>
      ) : !isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>You need to sign in to view your orders.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => login()}>Sign in</Button>
            <Button asChild variant="outline">
              <Link href="/books">Browse books</Link>
            </Button>
          </CardContent>
        </Card>
      ) : !customerName ? (
        <Card>
          <CardHeader>
            <CardTitle>Missing username</CardTitle>
            <CardDescription>
              Your Keycloak user has no username, so we can’t load your orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/books">Back to books</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              {orders.length ? `${orders.length} order(s)` : "No orders yet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground py-6 text-sm">Loading…</div>
            ) : orders.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.id}</TableCell>
                      <TableCell className="text-muted-foreground">{fmtDate(o.orderDate)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {(o.status ?? "PENDING").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{money(o.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-muted-foreground py-6 text-sm">
                You haven’t placed any orders yet.
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/books">Browse books</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/carts">Open cart</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
