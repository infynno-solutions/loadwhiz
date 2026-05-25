import { redirect } from "@tanstack/react-router";

import { getAccessToken } from "@/lib/auth-session";

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function requireAuth(location: { href: string }) {
  if (!isAuthenticated()) {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }
}

export function redirectIfAuthenticated(redirectTo = "/app/dashboard") {
  if (isAuthenticated()) {
    throw redirect({ to: redirectTo });
  }
}
