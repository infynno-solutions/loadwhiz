"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import type { LoadTestResultSummary } from "@/api/generated/types.gen";
import { LoadTestResultStatusBadge } from "@/components/load-tests/load-test-result-status-badge";
import { formatLoadTestDate } from "@/lib/load-test-actions";

type ResultRunProgressProps = {
  result: LoadTestResultSummary;
  partial?: boolean;
};

export function ResultRunProgress({ result, partial }: ResultRunProgressProps) {
  const metrics = result.metrics;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-dashed p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Spinner className="size-5" />
        <span className="font-medium">Run in progress</span>
        <LoadTestResultStatusBadge status={result.status} />
        {partial ? (
          <Badge variant="outline" className="text-xs">
            Live metrics
          </Badge>
        ) : null}
      </div>
      <p className="text-muted-foreground text-sm">
        Charts update as k6 collects data. Started{" "}
        {formatLoadTestDate(result.started_at)}.
      </p>
      {metrics ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Requests</dt>
            <dd className="font-medium tabular-nums">
              {metrics.total_requests ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">RPS</dt>
            <dd className="font-medium tabular-nums">
              {metrics.rps != null ? metrics.rps.toFixed(2) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Error rate</dt>
            <dd className="font-medium tabular-nums">
              {metrics.error_rate_percent != null
                ? `${metrics.error_rate_percent.toFixed(1)}%`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Avg response</dt>
            <dd className="font-medium tabular-nums">
              {metrics.avg_ms != null ? `${metrics.avg_ms} ms` : "—"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-muted-foreground text-sm">
          Waiting for the first metrics from k6…
        </p>
      )}
    </div>
  );
}
