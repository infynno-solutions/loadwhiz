import type { HttpValidationError } from "@/api/generated/types.gen";

import { ApiRequestError, isApiRequestError } from "@/lib/api-request-error";

function isHttpValidationError(error: unknown): error is HttpValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "detail" in error &&
    Array.isArray((error as HttpValidationError).detail)
  );
}

/** FastAPI returns `detail` as a string or a Pydantic validation error list. */
export function extractFastApiDetail(error: unknown): string | undefined {
  if (typeof error === "string") {
    return error;
  }
  if (typeof error !== "object" || error === null || !("detail" in error)) {
    return undefined;
  }
  const { detail } = error as { detail: unknown };
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "object" && item !== null && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return null;
      })
      .filter((msg): msg is string => Boolean(msg));
    if (messages.length > 0) {
      return messages.join(" ");
    }
  }
  return undefined;
}

function messageForStatus(status: number, url?: string): string | undefined {
  if (status === 409) {
    if (url?.includes("/auth/register")) {
      return "This email is already registered. Try signing in.";
    }
    return "That action conflicts with existing data.";
  }
  if (status === 401) {
    return "Invalid email or password.";
  }
  if (status === 403) {
    return "Your account is disabled.";
  }
  if (status === 400) {
    return "Invalid request. Please check your input and try again.";
  }
  return undefined;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isApiRequestError(error)) {
    const fromBody = extractFastApiDetail(error.body);
    if (fromBody) {
      return fromBody;
    }
    return error.message;
  }

  const fastApiDetail = extractFastApiDetail(error);
  if (fastApiDetail) {
    return fastApiDetail;
  }

  if (isHttpValidationError(error)) {
    const messages = error.detail
      ?.map((item) => item.msg)
      .filter((msg): msg is string => Boolean(msg));
    if (messages?.length) {
      return messages.join(" ");
    }
  }

  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Cannot reach the API. Ensure the backend is running and API requests are proxied (dev) or CORS is configured.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function toApiRequestError(
  error: unknown,
  response: Response,
  requestUrl: string,
): ApiRequestError {
  const detail = extractFastApiDetail(error);
  const statusMessage = messageForStatus(response.status, requestUrl);
  const message =
    detail ??
    statusMessage ??
    (typeof error === "string" && error
      ? error
      : `Request failed (${String(response.status)})`);
  return new ApiRequestError(message, response.status, error);
}
