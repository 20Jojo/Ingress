const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in environment.");
}

export type PingResult = {
  ok: boolean;
  status: number;
  body: string;
  url: string;
};

type ApiOptions = {
  token?: string;
  signal?: AbortSignal;
};

export async function apiPost<TResponse = unknown>(
  path: string,
  body: unknown,
  options?: ApiOptions,
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`POST ${path} failed (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export async function pingApi(signal?: AbortSignal): Promise<PingResult> {
  const url = `${API_BASE_URL}/health/live`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  const body = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    body,
    url,
  };
}
