export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
};

const ACCESS_KEY = "wf.accessToken";
const REFRESH_KEY = "wf.refreshToken";

export function setTokens(accessToken: string, refreshToken: string) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function saveTokens(tokens: AuthTokens) {
  setTokens(tokens.accessToken, tokens.refreshToken);
}

export function getAccessToken(): string | null {
  if (!canUseLocalStorage()) return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseLocalStorage()) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  if (!canUseLocalStorage()) return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}
