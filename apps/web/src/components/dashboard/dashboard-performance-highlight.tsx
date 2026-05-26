"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import { Button } from "@loadwhiz/ui/components/button";
import { Card, CardContent, CardHeader } from "@loadwhiz/ui/components/card";
import { Separator } from "@loadwhiz/ui/components/separator";
import { Skeleton } from "@loadwhiz/ui/components/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, ClockIcon, ServerIcon } from "lucide-react";
import type { OrgDashboardHighlight } from "@/api/generated/types.gen";
import { LoadTestResultStatusBadge } from "@/components/load-tests/load-test-result-status-badge";
import { formatLoadTestDate } from "@/lib/load-test-actions";

function PassBadge({ passed }: { passed?: boolean | null }) {
  if (passed === true) return <Badge variant="success">Passed</Badge>;
  if (passed === false) return <Badge variant="destructive">Failed</Badge>;
  return null;
}

type MetricTileProps = {
  label: string;
  value: string;
};

function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2.5 ring-1 ring-border/60">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-semibold text-base tabular-nums leading-none">
        {value}
      </span>
    </div>
  );
}

type DashboardPerformanceHighlightProps = {
  highlight: OrgDashboardHighlight;
};

export function DashboardPerformanceHighlight({
  highlight,
}: DashboardPerformanceHighlightProps) {
  const isActive = highlight.kind === "active";
  const m = highlight.metrics;

  const canLink =
    highlight.status !== "not_ready" &&
    highlight.test_id &&
    highlight.result_id;

  return (
    <Card
      className={isActive ? "ring-sky-500/30 dark:ring-sky-500/20" : undefined}
    >
      <CardHeader className="pb-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Left: label + title + meta */}
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {isActive ? "Live now" : "Latest completed run"}
              </span>
              {isActive && (
                <Badge variant="info" className="gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-sky-500" />
                  Live
                </Badge>
              )}
            </div>
            <h2 className="truncate font-semibold text-base leading-snug">
              {highlight.test_name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
              <span className="flex items-center gap-1">
                <ServerIcon className="size-3" />
                {highlight.host_hostname}
              </span>
              {highlight.started_at && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {formatLoadTestDate(highlight.started_at)}
                  {highlight.finished_at && !isActive
                    ? ` → ${formatLoadTestDate(highlight.finished_at)}`
                    : null}
                </span>
              )}
            </div>
          </div>

          {/* Right: status + pass/fail + CTA */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <LoadTestResultStatusBadge
              status={
                highlight.status as Parameters<
                  typeof LoadTestResultStatusBadge
                >[0]["status"]
              }
            />
            <PassBadge passed={highlight.passed} />
            {canLink && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link
                    to="/app/tests/$testId/results/$resultId"
                    params={{
                      testId: highlight.test_id,
                      resultId: highlight.result_id,
                    }}
                  />
                }
              >
                {isActive ? "View live run" : "View result"}
                <ArrowRightIcon />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {m ? (
        <>
          <Separator />
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MetricTile
                label="RPS"
                value={m.rps != null ? m.rps.toFixed(2) : "—"}
              />
              <MetricTile
                label="Avg response"
                value={m.avg_ms != null ? `${m.avg_ms.toFixed(0)} ms` : "—"}
              />
              <MetricTile
                label="Error rate"
                value={
                  m.error_rate_percent != null
                    ? `${m.error_rate_percent.toFixed(2)}%`
                    : "—"
                }
              />
              <MetricTile
                label="Total requests"
                value={m.total_requests?.toLocaleString() ?? "—"}
              />
            </div>
          </CardContent>
        </>
      ) : null}
    </Card>
  );
}

export function DashboardPerformanceHighlightSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
      </CardHeader>
      <Separator />
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
