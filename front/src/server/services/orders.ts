import "server-only";

import { apiGet, apiPost } from "~/server/api-client";

export type Order = {
  id: number;
  customerName: string;
  orderDate?: string | null;
  status?:
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | null;
  totalAmount: number;
};

export async function listOrders() {
  return (await apiGet<Order[]>("/candidats/orders")) ?? [];
}

export async function getOrderById(id: number) {
  return apiGet<Order>(`/candidats/orders/${id}`);
}

export async function createOrder(
  input: Pick<Order, "customerName" | "totalAmount"> &
    Partial<Pick<Order, "orderDate" | "status">>,
) {
  const payload = {
    ...input,
    status: input.status ?? "PENDING",
    orderDate: input.orderDate ?? new Date().toISOString().slice(0, 19),
  };
  return apiPost<Order>("/candidats/orders", payload);
}
