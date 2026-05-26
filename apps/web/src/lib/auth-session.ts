import type { TokenResponse } from "@/api/generated/types.gen";

const ACCESS_TOKEN_KEY = "loadwhiz:access_token:v1";
const REFRESH_TOKEN_KEY = "loadwhiz:refresh_token:v1";
const ACCESS_COOKIE = "loadwhiz_access_token";
const REFRESH_COOKIE = "loadwhiz_refresh_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function canUseStorage() {
  return typeof window !== "undefined";
}

function parseCookieValue(
  cookieHeader: string | null,
  name: string,
): string | null {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return null;
}

function setCookie(name: string, value: string) {
  if (!canUseStorage()) return;
  // Sync tokens for SSR; Cookie Store API is not used for broad browser support.
  // biome-ignore lint/suspicious/noDocumentCookie: intentional session cookie for SSR hydration
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (!canUseStorage()) return;
  // biome-ignore lint/suspicious/noDocumentCookie: intentional session cookie for SSR hydration
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getAccessTokenFromCookie(
  cookieHeader: string | null,
): string | null {
  return parseCookieValue(cookieHeader, ACCESS_COOKIE);
}

export function getRefreshTokenFromCookie(
  cookieHeader: string | null,
): string | null {
  return parseCookieValue(cookieHeader, REFRESH_COOKIE);
}

export function getAccessToken(cookieHeader?: string | null): string | null {
  if (cookieHeader !== undefined) {
    return getAccessTokenFromCookie(cookieHeader);
  }

  if (!canUseStorage()) return null;

  const fromStorage = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (fromStorage) return fromStorage;

  return getAccessTokenFromCookie(document.cookie);
}

export function getRefreshToken(cookieHeader?: string | null): string | null {
  if (cookieHeader !== undefined) {
    return getRefreshTokenFromCookie(cookieHeader);
  }

  if (!canUseStorage()) return null;

  const fromStorage = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (fromStorage) return fromStorage;

  return getRefreshTokenFromCookie(document.cookie);
}

export function setSession(
  tokens: Pick<TokenResponse, "access_token" | "refresh_token">,
) {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  setCookie(ACCESS_COOKIE, tokens.access_token);
  setCookie(REFRESH_COOKIE, tokens.refresh_token);
}

export function clearSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  deleteCookie(ACCESS_COOKIE);
  deleteCookie(REFRESH_COOKIE);
}

/** Sync cookie tokens into localStorage after SSR hydration. */
export function hydrateSessionFromCookies() {
  if (!canUseStorage()) return;

  const access = getAccessTokenFromCookie(document.cookie);
  const refresh = getRefreshTokenFromCookie(document.cookie);
  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}
