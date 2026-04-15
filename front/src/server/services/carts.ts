import "server-only";

import { apiGet, apiPost } from "~/server/api-client";

export type Cart = {
  id: number;
  customerId?: number | null;
  totalAmount?: number | null;
  shippingAddress?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export async function listCarts() {
  const result = await apiGet<Cart[]>("/carts");
  return result ?? [];
}

export async function listCartsByCustomer(customerId: number) {
  const result = await apiGet<Cart[]>(`/carts/customer/${customerId}`);
  return result ?? [];
}

export async function createCart(
  input: Omit<Cart, "id" | "createdAt" | "updatedAt">,
) {
  return apiPost<Cart>("/carts", input);
}
