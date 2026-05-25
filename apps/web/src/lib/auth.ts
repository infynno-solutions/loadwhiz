import { redirect } from "@tanstack/react-router";

import { getAccessToken, hydrateSessionFromCookies } from "@/lib/auth-session";

export function isAuthenticated(cookieHeader?: string | null): boolean {
  return Boolean(getAccessToken(cookieHeader));
}

export function requireAuth(location: { href: string }) {
  // SSR has no localStorage; auth is enforced via server fn in /app beforeLoad.
  if (typeof window === "undefined") {
    return;
  }

  hydrateSessionFromCookies();

  if (!isAuthenticated()) {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }
}

export function redirectIfAuthenticated(redirectTo = "/app/dashboard") {
  if (typeof window === "undefined") {
    return;
  }

  hydrateSessionFromCookies();

  if (isAuthenticated()) {
    throw redirect({ to: redirectTo });
  }
}
