import type {
  DashboardByUrl,
  DashboardDistributionBucket,
  DashboardTimeseriesPoint,
  LoadTestResultDashboardResponse,
  LoadTestResultSummary,
} from "@/api/generated/types.gen";

export function formatPdfDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function formatNum(
  value: number | null | undefined,
  decimals = 2,
): string {
  if (value == null) return "—";
  return value.toFixed(decimals);
}

export function sanitizePdfFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function buildResultPdfFilename(
  dashboard: LoadTestResultDashboardResponse,
  result: LoadTestResultSummary,
): string {
  const testName = sanitizePdfFilename(dashboard.meta.test_name);
  const shortId = result.result_id.slice(0, 8);
  const date = result.finished_at ?? result.started_at ?? result.created_at;
  const datePart = date ? new Date(date).toISOString().slice(0, 10) : "report";
  return `${testName}-${shortId}-${datePart}.pdf`;
}

export function isResultPdfReady(
  dashboard: LoadTestResultDashboardResponse | undefined,
  isLive: boolean,
  partial: boolean,
): boolean {
  if (!dashboard) return false;
  if (isLive || partial) return false;
  const status = dashboard.meta.status;
  return status === "ready" || status === "failed" || status === "cancelled";
}

export type PdfTableRow = { cells: string[] };

export function overviewRows(
  dashboard: LoadTestResultDashboardResponse,
  result: LoadTestResultSummary,
): PdfTableRow[] {
  const { meta, overview } = dashboard;
  const m = result.metrics;
  return [
    { cells: ["Avg response", `${formatNum(overview.avg_response_ms, 0)} ms`] },
    { cells: ["Error rate", `${formatNum(overview.error_rate_percent)}%`] },
    { cells: ["Total requests", String(overview.total_requests ?? "—")] },
    { cells: ["RPS", formatNum(overview.rps)] },
    {
      cells: ["P95", m?.p95_ms != null ? `${formatNum(m.p95_ms, 0)} ms` : "—"],
    },
    {
      cells: [
        "Duration",
        m?.duration_seconds != null
          ? `${formatNum(m.duration_seconds, 0)} s`
          : `${meta.duration_seconds} s (configured)`,
      ],
    },
  ];
}

export function responseTimeRows(
  dashboard: LoadTestResultDashboardResponse,
): PdfTableRow[] {
  const rt = dashboard.aggregates.response_times;
  return [
    { cells: ["Average", `${formatNum(rt.avg_ms, 0)} ms`] },
    { cells: ["Min", `${formatNum(rt.min_ms, 0)} ms`] },
    { cells: ["Max", `${formatNum(rt.max_ms, 0)} ms`] },
    { cells: ["Median", `${formatNum(rt.med_ms, 0)} ms`] },
    { cells: ["P90", `${formatNum(rt.p90_ms, 0)} ms`] },
    { cells: ["P95", `${formatNum(rt.p95_ms, 0)} ms`] },
  ];
}

export function statusCodeRows(
  dashboard: LoadTestResultDashboardResponse,
): PdfTableRow[] {
  const rows = dashboard.aggregates.by_status_code ?? [];
  if (rows.length === 0) {
    return [{ cells: ["—", "No status breakdown"] }];
  }
  return rows.map((row) => {
    const label =
      !row.status || row.status === "0" ? "Timeout / no response" : row.status;
    return {
      cells: [label, String(row.count ?? 0)],
    };
  });
}

export function responseCountRows(
  dashboard: LoadTestResultDashboardResponse,
): PdfTableRow[] {
  const c = dashboard.aggregates.response_counts;
  const b = dashboard.aggregates.bandwidth;
  return [
    { cells: ["Total", String(c.total ?? "—")] },
    { cells: ["Success", String(c.success ?? "—")] },
    { cells: ["Timeout", String(c.timeout ?? "—")] },
    { cells: ["4xx", String(c.error_4xx ?? "—")] },
    { cells: ["5xx", String(c.error_5xx ?? "—")] },
    { cells: ["Network errors", String(c.network_errors ?? "—")] },
    {
      cells: [
        "Bytes sent",
        b.bytes_sent != null ? b.bytes_sent.toLocaleString() : "—",
      ],
    },
    {
      cells: [
        "Bytes received",
        b.bytes_received != null ? b.bytes_received.toLocaleString() : "—",
      ],
    },
  ];
}

export function timeseriesRows(
  points: DashboardTimeseriesPoint[],
  maxRows = 60,
): PdfTableRow[] {
  const slice =
    points.length > maxRows
      ? [
          ...points.slice(0, Math.floor(maxRows / 2)),
          ...points.slice(-Math.ceil(maxRows / 2)),
        ]
      : points;

  return slice.map((p) => ({
    cells: [
      `${p.offset_sec}s`,
      String(p.requests ?? 0),
      p.avg_response_ms != null ? `${formatNum(p.avg_response_ms, 0)} ms` : "—",
      String(p.error_count ?? 0),
    ],
  }));
}

export function distributionRows(
  buckets: DashboardDistributionBucket[],
): PdfTableRow[] {
  return buckets.map((b) => ({
    cells: [`${b.bucket_start_ms}–${b.bucket_end_ms} ms`, String(b.count)],
  }));
}

export function byUrlRows(rows: DashboardByUrl[], maxRows = 40): PdfTableRow[] {
  return rows.slice(0, maxRows).map((r) => ({
    cells: [
      `${r.method} ${r.url}`,
      String(r.requests),
      r.avg_ms != null ? `${formatNum(r.avg_ms, 0)} ms` : "—",
      `${formatNum(r.error_rate_percent)}%`,
    ],
  }));
}
