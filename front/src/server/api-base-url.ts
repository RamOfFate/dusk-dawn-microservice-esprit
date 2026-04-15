import "server-only";

import { env } from "~/env";

export function getApiBaseUrl() {
  return (
    env.API_BASE_URL ??
    env.NEXT_PUBLIC_API_BASE_URL ??
    // default gateway port from the provided HTML spec
    "http://localhost:8060"
  );
}
