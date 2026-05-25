import {
  authLogout,
  authRefresh,
  authResendVerification,
  authVerifyEmail,
} from "@/api/generated/sdk.gen";
import { clearSession, getRefreshToken, setSession } from "@/lib/auth-session";
import { queryClient } from "@/lib/query-client";

export async function signOut() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await authLogout({
        body: { refresh_token: refreshToken },
        throwOnError: true,
      });
    } catch {
      // Clear local session even if revoke fails.
    }
  }
  clearSession();
  queryClient.clear();
}

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const { data } = await authRefresh({
    body: { refresh_token: refreshToken },
    throwOnError: true,
  });

  if (!data) {
    throw new Error("Failed to refresh session");
  }

  setSession(data);
  return data;
}

export async function verifyEmail(token: string) {
  const { data } = await authVerifyEmail({
    body: { token },
    throwOnError: true,
  });
  return data;
}

export async function resendVerificationEmail() {
  const { data } = await authResendVerification({ throwOnError: true });
  return data;
}
