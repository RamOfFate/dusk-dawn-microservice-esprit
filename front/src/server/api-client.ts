import "server-only";

import { getApiBaseUrl } from "~/server/api-base-url";

export class ApiError extends Error {
  public status: number;
  public url: string;

  constructor(message: string, opts: { status: number; url: string }) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.url = opts.url;
  }
}

function joinUrl(baseUrl: string, path: string) {
  if (!path.startsWith("/")) return `${baseUrl}/${path}`;
  return `${baseUrl}${path}`;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const baseUrl = getApiBaseUrl();
  const url = joinUrl(baseUrl, path);

  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 204) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(
      `Request failed (${res.status})${text ? `: ${text}` : ""}`,
      { status: res.status, url },
    );
  }

  return (await res.json()) as T;
}

export async function apiGet<T>(path: string) {
  return apiFetch<T>(path, { method: "GET" });
}

export async function apiPost<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}
