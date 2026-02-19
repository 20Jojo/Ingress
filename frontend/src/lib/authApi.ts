import { apiPost } from "@/lib/api";
import {
  type AuthTokens,
  clearTokens,
  getRefreshToken,
  saveTokens,
} from "@/lib/auth";

type RegisterReq = { email: string; displayName: string; password: string };
type LoginReq = { email: string; password: string };
type RefreshReq = { refreshToken: string };

export async function register(req: RegisterReq) {
  return apiPost("/auth/register", req);
}

export async function login(req: LoginReq) {
  const tokens = await apiPost<AuthTokens>("/auth/login", req);
  saveTokens(tokens);
  return tokens;
}

export async function refresh() {
  const rt = getRefreshToken();
  if (!rt) throw new Error("No refresh token saved");

  const tokens = await apiPost<AuthTokens>(
    "/auth/refresh",
    { refreshToken: rt } satisfies RefreshReq,
  );
  saveTokens(tokens);
  return tokens;
}

export async function logout() {
  const rt = getRefreshToken();
  if (!rt) {
    clearTokens();
    return;
  }

  try {
    await apiPost("/auth/logout", { refreshToken: rt } satisfies RefreshReq);
  } finally {
    clearTokens();
  }
}

