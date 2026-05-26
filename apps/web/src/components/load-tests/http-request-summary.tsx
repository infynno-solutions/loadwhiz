import type { HttpRequestConfig } from "@/api/generated/types.gen";

function formatMap(map?: Record<string, string> | null) {
  if (!map || Object.keys(map).length === 0) return null;
  return Object.entries(map)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

type HttpRequestSummaryProps = {
  request: HttpRequestConfig;
};

export function HttpRequestSummary({ request }: HttpRequestSummaryProps) {
  const headers = formatMap(request.headers);
  const params = formatMap(request.request_params);
  const cookies = formatMap(request.cookies);

  return (
    <div className="space-y-1.5 font-mono text-xs">
      <p>
        <span className="font-medium font-sans text-muted-foreground">
          {request.request_type ?? "GET"}
        </span>{" "}
        {request.url}
      </p>
      {headers ? (
        <p>
          <span className="font-sans text-muted-foreground">Headers:</span>{" "}
          {headers}
        </p>
      ) : null}
      {params ? (
        <p>
          <span className="font-sans text-muted-foreground">Query:</span>{" "}
          {params}
        </p>
      ) : null}
      {cookies ? (
        <p>
          <span className="font-sans text-muted-foreground">Cookies:</span>{" "}
          {cookies}
        </p>
      ) : null}
      {request.credentials ? (
        <p>
          <span className="font-sans text-muted-foreground">Auth:</span> Basic (
          {request.credentials.login})
        </p>
      ) : null}
      {request.bearer ? (
        <p>
          <span className="font-sans text-muted-foreground">Auth:</span>{" "}
          {request.bearer.prefix ?? "Bearer"} token
        </p>
      ) : null}
      {request.raw_post_body ? (
        <p className="line-clamp-3 whitespace-pre-wrap">
          <span className="font-sans text-muted-foreground">Body:</span>{" "}
          {request.raw_post_body}
        </p>
      ) : null}
      {request.payload_file_url ? (
        <p className="truncate">
          <span className="font-sans text-muted-foreground">Payload file:</span>{" "}
          {request.payload_file_url}
        </p>
      ) : null}
      {request.variables?.length ? (
        <p>
          <span className="font-sans text-muted-foreground">Variables:</span>{" "}
          {request.variables.map((v) => `${v.name} ← ${v.property}`).join("; ")}
        </p>
      ) : null}
      {request.auth_hint ? (
        <p className="font-sans text-amber-700 dark:text-amber-300">
          {request.auth_hint}
        </p>
      ) : null}
    </div>
  );
}
