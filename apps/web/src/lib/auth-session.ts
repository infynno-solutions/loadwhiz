import type { TokenResponse } from "@/api/generated/types.gen";

const ACCESS_TOKEN_KEY = "loadwhiz:access_token:v1";
const REFRESH_TOKEN_KEY = "loadwhiz:refresh_token:v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setSession(
  tokens: Pick<TokenResponse, "access_token" | "refresh_token">,
) {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
