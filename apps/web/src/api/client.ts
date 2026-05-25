import { env } from "@loadwhiz/env/web";

import { client } from "@/api/generated/client.gen";
import { toApiRequestError } from "@/lib/api-errors";
import { getAccessToken } from "@/lib/auth-session";

/** Browser calls same-origin `/api` (Vite/Bun proxy). SSR uses the full API URL. */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return env.VITE_API_URL;
}

client.setConfig({
  baseUrl: getApiBaseUrl(),
  auth: async () => getAccessToken() ?? undefined,
});

client.interceptors.error.use(async (error, response, request) => {
  throw toApiRequestError(error, response, request.url);
});
