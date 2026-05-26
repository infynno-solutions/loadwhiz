import type { HttpRequestConfig } from "@/api/generated/types.gen";
import type { UrlRow } from "@/schemas/load-tests";

function cleanStringMap(
  map?: Record<string, string> | null,
): Record<string, string> | undefined {
  if (!map) return undefined;
  const entries = Object.entries(map).filter(
    ([key, value]) => key.trim() && value.trim(),
  );
  if (entries.length === 0) return undefined;
  return Object.fromEntries(
    entries.map(([key, value]) => [key.trim(), value.trim()]),
  );
}

export function urlRowToHttpRequest(row: UrlRow): HttpRequestConfig {
  const request: HttpRequestConfig = {
    url: row.url.trim(),
    request_type: row.request_type ?? "GET",
  };

  const headers = cleanStringMap(row.headers);
  if (headers) request.headers = headers;

  const requestParams = cleanStringMap(row.request_params);
  if (requestParams) request.request_params = requestParams;

  const cookies = cleanStringMap(row.cookies);
  if (cookies) request.cookies = cookies;

  const body = row.raw_post_body?.trim();
  if (body) request.raw_post_body = body;

  const payloadUrl = row.payload_file_url?.trim();
  if (payloadUrl) request.payload_file_url = payloadUrl;

  if (row.credentials?.login?.trim()) {
    request.credentials = {
      login: row.credentials.login.trim(),
      password: row.credentials.password ?? "",
    };
    request.bearer = null;
  } else if (row.bearer?.token?.trim()) {
    request.bearer = {
      token: row.bearer.token.trim(),
      prefix: row.bearer.prefix?.trim() || undefined,
      header_name: row.bearer.header_name?.trim() || undefined,
    };
    request.credentials = null;
  }

  const variables = row.variables?.filter(
    (v) => v.name.trim() && v.property.trim(),
  );
  if (variables?.length) {
    request.variables = variables.map((v) => ({
      name: v.name.trim(),
      property: v.property.trim(),
      source: "header" as const,
    }));
  }

  return request;
}

function mergeImportedAuthIntoHeaders(
  config: HttpRequestConfig,
): Record<string, string> {
  const headers = { ...(config.headers ?? {}) };
  const hasAuthorizationHeader = Object.keys(headers).some(
    (key) => key.toLowerCase() === "authorization" && headers[key]?.trim(),
  );

  if (config.bearer?.token?.trim() && !hasAuthorizationHeader) {
    const headerName = config.bearer.header_name?.trim() || "Authorization";
    const prefix = config.bearer.prefix?.trim() || "Bearer";
    headers[headerName] = `${prefix} ${config.bearer.token}`.trim();
  }

  if (
    config.credentials?.login?.trim() &&
    config.credentials.password &&
    !Object.keys(headers).some(
      (key) => key.toLowerCase() === "authorization" && headers[key]?.trim(),
    )
  ) {
    const encoded = btoa(
      `${config.credentials.login}:${config.credentials.password}`,
    );
    headers.Authorization = `Basic ${encoded}`;
  }

  return headers;
}

export function httpRequestToUrlRow(config: HttpRequestConfig): UrlRow {
  return {
    url: config.url,
    request_type: config.request_type ?? "GET",
    headers: mergeImportedAuthIntoHeaders(config),
    request_params: config.request_params ?? {},
    cookies: config.cookies ?? {},
    raw_post_body: config.raw_post_body ?? "",
    payload_file_url: config.payload_file_url ?? "",
    variables:
      config.variables?.map((v) => ({
        name: v.name,
        property: v.property,
        source: "header" as const,
      })) ?? [],
    auth_hint: config.auth_hint ?? undefined,
  };
}

export function emptyUrlRow(): UrlRow {
  return {
    url: "",
    request_type: "GET",
    headers: {},
    request_params: {},
    cookies: {},
    raw_post_body: "",
    payload_file_url: "",
    variables: [],
  };
}
