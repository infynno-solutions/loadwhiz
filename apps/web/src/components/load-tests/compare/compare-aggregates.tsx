"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import type { LoadTestResultDashboardResponse } from "@/api/generated/types.gen";
import { formatDelta } from "@/lib/compare-runs";

type CompareAggregatesProps = {
  dashboardA: LoadTestResultDashboardResponse;
  dashboardB: LoadTestResultDashboardResponse;
  labelA?: string;
  labelB?: string;
};

type AggregateRow = {
  label: string;
  a: string;
  b: string;
  delta: ReturnType<typeof formatDelta>;
};

function buildRows(
  dashboardA: LoadTestResultDashboardResponse,
  dashboardB: LoadTestResultDashboardResponse,
): AggregateRow[] {
  const rtA = dashboardA.aggregates.response_times;
  const rtB = dashboardB.aggregates.response_times;
  const cA = dashboardA.aggregates.response_counts;
  const cB = dashboardB.aggregates.response_counts;

  const row = (
    label: string,
    a: number | null | undefined,
    b: number | null | undefined,
    opts?: Parameters<typeof formatDelta>[2],
  ): AggregateRow => ({
    label,
    a: a != null ? String(a) : "—",
    b: b != null ? String(b) : "—",
    delta: formatDelta(a, b, opts),
  });

  return [
    row("P90 (ms)", rtA.p90_ms, rtB.p90_ms, {
      higherIsWorse: true,
      suffix: " ms",
      decimals: 0,
    }),
    row("P95 (ms)", rtA.p95_ms, rtB.p95_ms, {
      higherIsWorse: true,
      suffix: " ms",
      decimals: 0,
    }),
    row("Success count", cA.success, cB.success, { decimals: 0 }),
    row("5xx errors", cA.error_5xx, cB.error_5xx, {
      higherIsWorse: true,
      decimals: 0,
    }),
    row("Timeouts", cA.timeout, cB.timeout, {
      higherIsWorse: true,
      decimals: 0,
    }),
  ];
}

export function CompareAggregates({
  dashboardA,
  dashboardB,
  labelA = "Run A",
  labelB = "Run B",
}: CompareAggregatesProps) {
  const rows = buildRows(dashboardA, dashboardB);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aggregates</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.label} className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">{r.label}</dt>
              <dd className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">{labelA}</p>
                  <p className="font-medium tabular-nums">{r.a}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{labelB}</p>
                  <p className="font-medium tabular-nums">{r.b}</p>
                </div>
              </dd>
              {r.delta ? (
                <p className="mt-2 text-muted-foreground text-xs tabular-nums">
                  Δ {r.delta.absolute}
                  {r.delta.percent ? ` (${r.delta.percent})` : null}
                </p>
              ) : null}
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
