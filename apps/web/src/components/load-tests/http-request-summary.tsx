import type { HttpRequestConfig } from "@/api/generated/types.gen";

type HttpRequestSummaryProps = {
  request: HttpRequestConfig;
};

function KeyValueLines({
  label,
  map,
}: {
  label: string;
  map: Record<string, string>;
}) {
  const entries = Object.entries(map);
  if (entries.length === 0) return null;

  return (
    <div className="min-w-0">
      <p className="font-sans text-muted-foreground">{label}</p>
      <ul className="mt-0.5 list-none space-y-0.5 pl-0">
        {entries.map(([key, value]) => (
          <li key={key} className="whitespace-pre-wrap break-all">
            <span className="text-muted-foreground">{key}:</span> {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HttpRequestSummary({ request }: HttpRequestSummaryProps) {
  return (
    <div className="min-w-0 space-y-1.5 font-mono text-xs">
      <p className="break-all">
        <span className="font-medium font-sans text-muted-foreground">
          {request.request_type ?? "GET"}
        </span>{" "}
        {request.url}
      </p>
      {request.headers ? (
        <KeyValueLines label="Headers" map={request.headers} />
      ) : null}
      {request.request_params ? (
        <KeyValueLines label="Query" map={request.request_params} />
      ) : null}
      {request.cookies ? (
        <KeyValueLines label="Cookies" map={request.cookies} />
      ) : null}
      {request.credentials ? (
        <p className="break-all">
          <span className="font-sans text-muted-foreground">Auth:</span> Basic (
          {request.credentials.login})
        </p>
      ) : null}
      {request.bearer ? (
        <p className="break-all">
          <span className="font-sans text-muted-foreground">Auth:</span>{" "}
          {request.bearer.prefix ?? "Bearer"} token
        </p>
      ) : null}
      {request.raw_post_body ? (
        <p className="line-clamp-3 whitespace-pre-wrap break-all">
          <span className="font-sans text-muted-foreground">Body:</span>{" "}
          {request.raw_post_body}
        </p>
      ) : null}
      {request.payload_file_url ? (
        <p className="break-all">
          <span className="font-sans text-muted-foreground">Payload file:</span>{" "}
          {request.payload_file_url}
        </p>
      ) : null}
      {request.variables?.length ? (
        <p className="break-all">
          <span className="font-sans text-muted-foreground">Variables:</span>{" "}
          {request.variables.map((v) => `${v.name} ← ${v.property}`).join("; ")}
        </p>
      ) : null}
      {request.auth_hint ? (
        <p className="break-all font-sans text-amber-700 dark:text-amber-300">
          {request.auth_hint}
        </p>
      ) : null}
    </div>
  );
}
