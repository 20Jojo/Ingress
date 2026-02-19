import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  console.warn("NEXT_PUBLIC_API_BASE_URL is not set.");
}

type Json = unknown;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken || !BASE_URL) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
  };
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function authFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  if (!BASE_URL && !input.startsWith("http")) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set.");
  }

  const url = input.startsWith("http") ? input : `${BASE_URL}${input}`;

  const accessToken = getAccessToken();
  const headers = new Headers(init?.headers);

  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    const newAccess = await refreshAccessToken();
    if (!newAccess) return res;

    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set("Authorization", `Bearer ${newAccess}`);
    if (!retryHeaders.has("Content-Type") && init?.body) {
      retryHeaders.set("Content-Type", "application/json");
    }

    res = await fetch(url, { ...init, headers: retryHeaders });
  }

  return res;
}

export async function authJson<T = Json>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await authFetch(input, init);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `  ${text}` : ""}`);
  }

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await res.json()) as T;

  return (await res.text()) as unknown as T;
}
