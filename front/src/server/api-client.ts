import "server-only";

import { getApiBaseUrl } from "~/server/api-base-url";

import { ApiError } from "~/lib/api-error";

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
    const contentType = res.headers.get("content-type") ?? "";
    let details = "";

    if (contentType.includes("application/json")) {
      try {
        const data = (await res.json()) as unknown;
        details = typeof data === "string" ? data : JSON.stringify(data);
      } catch {
        details = "";
      }
    } else {
      details = await res.text().catch(() => "");
    }

    const shortDetails = details
      ? details.length > 500
        ? `${details.slice(0, 500)}…`
        : details
      : undefined;

    throw new ApiError(`Request failed (HTTP ${res.status})`, {
      status: res.status,
      url,
      details: shortDetails,
    });
  }

  return (await res.json()) as T;
}

export async function apiGet<T>(path: string) {
  return apiFetch<T>(path, { method: "GET" });
}

export async function apiPost<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}
