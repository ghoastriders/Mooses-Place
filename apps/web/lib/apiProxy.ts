import { API_BASE } from "@/lib/config";

export async function apiProxy(path: string, init?: RequestInit) {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {})
    },
    // FastAPI service handles caching; keep Next routes dynamic
    cache: "no-store"
  });
  return res;
}
