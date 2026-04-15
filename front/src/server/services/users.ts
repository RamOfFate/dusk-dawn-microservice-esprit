import "server-only";

import { apiGet, apiPost } from "~/server/api-client";

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  password?: string;
};

export async function listUsers() {
  return (await apiGet<User[]>("/users")) ?? [];
}

export async function getUserById(id: number) {
  return apiGet<User>(`/users/${id}`);
}

export async function createUser(
  input: Pick<User, "name" | "email" | "role" | "password">,
) {
  return apiPost<User>("/users", input);
}
