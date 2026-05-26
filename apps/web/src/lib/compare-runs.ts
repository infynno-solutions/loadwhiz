import type {
  DashboardByUrl,
  DashboardOverview,
  LoadTestResultDashboardResponse,
} from "@/api/generated/types.gen";
import { isActiveResultStatus } from "@/lib/load-test-actions";

export function isCompareDashboardReady(
  dashboard: LoadTestResultDashboardResponse | undefined,
): boolean {
  if (!dashboard) return false;
  if (dashboard.meta.partial) return false;
  return !isActiveResultStatus(dashboard.meta.status);
}

export type ByUrlCompareRow = {
  key: string;
  method: string;
  url: string;
  label: string;
  a?: DashboardByUrl;
  b?: DashboardByUrl;
};

export function mergeByUrlForCompare(
  aRows: DashboardByUrl[],
  bRows: DashboardByUrl[],
): ByUrlCompareRow[] {
  const map = new Map<string, ByUrlCompareRow>();

  for (const row of aRows) {
    const key = `${row.method}\0${row.url}`;
    map.set(key, {
      key,
      method: row.method,
      url: row.url,
      label: row.label,
      a: row,
    });
  }

  for (const row of bRows) {
    const key = `${row.method}\0${row.url}`;
    const existing = map.get(key);
    if (existing) {
      existing.b = row;
    } else {
      map.set(key, {
        key,
        method: row.method,
        url: row.url,
        label: row.label,
        b: row,
      });
    }
  }

  return [...map.values()].sort((x, y) => {
    const aReq = (x.a?.requests ?? 0) + (x.b?.requests ?? 0);
    const bReq = (y.a?.requests ?? 0) + (y.b?.requests ?? 0);
    return bReq - aReq;
  });
}

export type DeltaFormat = {
  absolute: string;
  percent: string | null;
  regression: boolean;
};

export function formatDelta(
  a: number | null | undefined,
  b: number | null | undefined,
  options?: {
    suffix?: string;
    higherIsWorse?: boolean;
    decimals?: number;
  },
): DeltaFormat | null {
  if (a == null || b == null) return null;
  const decimals = options?.decimals ?? 2;
  const diff = b - a;
  const suffix = options?.suffix ?? "";
  const percent =
    a !== 0 ? `${((diff / a) * 100).toFixed(1)}%` : diff !== 0 ? "—" : "0%";
  const sign = diff > 0 ? "+" : "";
  const regression = options?.higherIsWorse
    ? diff > 0
    : options?.higherIsWorse === false
      ? diff < 0
      : false;

  return {
    absolute: `${sign}${diff.toFixed(decimals)}${suffix}`,
    percent: diff !== 0 ? percent : "0%",
    regression,
  };
}

export type OverviewMetricKey =
  | "rps"
  | "avg_response_ms"
  | "error_rate_percent"
  | "total_requests";

export const OVERVIEW_METRIC_LABELS: Record<OverviewMetricKey, string> = {
  rps: "RPS",
  avg_response_ms: "Avg response",
  error_rate_percent: "Error rate",
  total_requests: "Total requests",
};

export function getOverviewMetric(
  overview: DashboardOverview,
  key: OverviewMetricKey,
): number | null {
  switch (key) {
    case "rps":
      return overview.rps ?? null;
    case "avg_response_ms":
      return overview.avg_response_ms ?? null;
    case "error_rate_percent":
      return overview.error_rate_percent ?? null;
    case "total_requests":
      return overview.total_requests ?? null;
  }
}

export function formatOverviewValue(
  key: OverviewMetricKey,
  value: number | null,
): string {
  if (value == null) return "—";
  switch (key) {
    case "avg_response_ms":
      return `${value.toFixed(0)} ms`;
    case "error_rate_percent":
      return `${value.toFixed(2)}%`;
    case "total_requests":
      return value.toLocaleString();
    case "rps":
      return value.toFixed(2);
  }
}

export function mergeTimeseriesForCompare(
  aPoints: LoadTestResultDashboardResponse["timeseries"],
  bPoints: LoadTestResultDashboardResponse["timeseries"],
) {
  const offsets = new Set<number>();
  for (const p of aPoints ?? []) offsets.add(p.offset_sec);
  for (const p of bPoints ?? []) offsets.add(p.offset_sec);
  const sorted = [...offsets].sort((x, y) => x - y);

  const aMap = new Map((aPoints ?? []).map((p) => [p.offset_sec, p]));
  const bMap = new Map((bPoints ?? []).map((p) => [p.offset_sec, p]));

  return sorted.map((offset) => ({
    offset,
    a_requests: aMap.get(offset)?.requests ?? null,
    b_requests: bMap.get(offset)?.requests ?? null,
    a_avg_ms: aMap.get(offset)?.avg_response_ms ?? null,
    b_avg_ms: bMap.get(offset)?.avg_response_ms ?? null,
  }));
}

export function mergeDistributionForCompare(
  aBuckets: LoadTestResultDashboardResponse["distribution"],
  bBuckets: LoadTestResultDashboardResponse["distribution"],
) {
  const keys = new Set<string>();
  for (const b of aBuckets ?? []) {
    keys.add(`${b.bucket_start_ms}-${b.bucket_end_ms}`);
  }
  for (const b of bBuckets ?? []) {
    keys.add(`${b.bucket_start_ms}-${b.bucket_end_ms}`);
  }

  const aMap = new Map(
    (aBuckets ?? []).map((b) => [
      `${b.bucket_start_ms}-${b.bucket_end_ms}`,
      b,
    ]),
  );
  const bMap = new Map(
    (bBuckets ?? []).map((b) => [
      `${b.bucket_start_ms}-${b.bucket_end_ms}`,
      b,
    ]),
  );

  return [...keys]
    .map((key) => {
      const a = aMap.get(key);
      const b = bMap.get(key);
      const start = a?.bucket_start_ms ?? b?.bucket_start_ms ?? 0;
      const end = a?.bucket_end_ms ?? b?.bucket_end_ms ?? 0;
      return {
        label: `${start}–${end}ms`,
        a_count: a?.count ?? 0,
        b_count: b?.count ?? 0,
      };
    })
    .sort((x, y) => {
      const ax = Number.parseInt(x.label, 10);
      const bx = Number.parseInt(y.label, 10);
      return ax - bx;
    });
}
