"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@loadwhiz/ui/components/table";
import { cn } from "@loadwhiz/ui/lib/utils";
import type { LoadTestResultDashboardResponse } from "@/api/generated/types.gen";
import {
  formatDelta,
  formatOverviewValue,
  getOverviewMetric,
  OVERVIEW_METRIC_LABELS,
  type OverviewMetricKey,
} from "@/lib/compare-runs";

const METRICS: OverviewMetricKey[] = [
  "rps",
  "avg_response_ms",
  "error_rate_percent",
  "total_requests",
];

const DELTA_OPTIONS: Record<
  OverviewMetricKey,
  { higherIsWorse?: boolean; suffix?: string; decimals?: number }
> = {
  rps: { higherIsWorse: false, decimals: 2 },
  avg_response_ms: { higherIsWorse: true, suffix: " ms", decimals: 0 },
  error_rate_percent: { higherIsWorse: true, suffix: "%", decimals: 2 },
  total_requests: { higherIsWorse: false, decimals: 0 },
};

type CompareOverviewTableProps = {
  dashboardA: LoadTestResultDashboardResponse;
  dashboardB: LoadTestResultDashboardResponse;
  labelA?: string;
  labelB?: string;
};

export function CompareOverviewTable({
  dashboardA,
  dashboardB,
  labelA = "Run A",
  labelB = "Run B",
}: CompareOverviewTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Metric</TableHead>
            <TableHead>{labelA}</TableHead>
            <TableHead>{labelB}</TableHead>
            <TableHead>Change (B vs A)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {METRICS.map((key) => {
            const aVal = getOverviewMetric(dashboardA.overview, key);
            const bVal = getOverviewMetric(dashboardB.overview, key);
            const delta = formatDelta(aVal, bVal, DELTA_OPTIONS[key]);

            return (
              <TableRow key={key}>
                <TableCell className="pl-4 font-medium">
                  {OVERVIEW_METRIC_LABELS[key]}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatOverviewValue(key, aVal)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatOverviewValue(key, bVal)}
                </TableCell>
                <TableCell>
                  {delta ? (
                    <span
                      className={cn(
                        "text-sm tabular-nums",
                        delta.regression && "font-medium text-destructive",
                        !delta.regression &&
                          delta.absolute.startsWith("-") &&
                          "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {delta.absolute}
                      {delta.percent ? ` (${delta.percent})` : null}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
