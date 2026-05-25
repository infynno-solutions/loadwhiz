import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import {
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
} from "@/lib/auth-session";

export const getServerSessionTokens = createServerFn({
  method: "GET",
}).handler(async () => {
  const cookieHeader = getRequestHeader("cookie") ?? null;
  return {
    accessToken: getAccessTokenFromCookie(cookieHeader),
    refreshToken: getRefreshTokenFromCookie(cookieHeader),
  };
});
