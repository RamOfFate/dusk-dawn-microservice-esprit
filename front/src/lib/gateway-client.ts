import { env } from "~/env";

export class GatewayError extends Error {
  status?: number;
  url?: string;
  details?: string;

  constructor(
    message: string,
    opts?: { status?: number; url?: string; details?: string },
  ) {
    super(message);
    this.name = "GatewayError";
    this.status = opts?.status;
    this.url = opts?.url;
    this.details = opts?.details;
  }
}

function joinUrl(baseUrl: string, path: string) {
  if (!path.startsWith("/")) return `${baseUrl}/${path}`;
  return `${baseUrl}${path}`;
}

export function getGatewayBaseUrl() {
  return env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8060";
}

export async function gatewayFetch<T>(
  path: string,
  init?: RequestInit & { token?: string | null },
): Promise<T | null> {
  const baseUrl = getGatewayBaseUrl();
  const url = joinUrl(baseUrl, path);

  const headers = new Headers(init?.headers ?? undefined);
  if (!headers.has("content-type"))
    headers.set("content-type", "application/json");
  if (init?.token) headers.set("authorization", `Bearer ${init.token}`);

  const res = await fetch(url, {
    ...init,
    headers,
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

    throw new GatewayError(`Request failed (HTTP ${res.status})`, {
      status: res.status,
      url,
      details: shortDetails,
    });
  }

  const okContentType = res.headers.get("content-type") ?? "";
  if (okContentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  const text = await res.text().catch(() => "");
  return text ? (text as unknown as T) : null;
}

export async function gatewayGet<T>(path: string, token?: string | null) {
  return gatewayFetch<T>(path, { method: "GET", token });
}

export async function gatewayPost<T>(
  path: string,
  body: unknown,
  token?: string | null,
) {
  return gatewayFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });
}

export async function gatewayPut<T>(
  path: string,
  body: unknown,
  token?: string | null,
) {
  return gatewayFetch<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
    token,
  });
}

export async function gatewayDelete<T>(path: string, token?: string | null) {
  return gatewayFetch<T>(path, { method: "DELETE", token });
}
