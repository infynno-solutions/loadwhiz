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
import { formatDelta, mergeByUrlForCompare } from "@/lib/compare-runs";

type CompareByUrlTableProps = {
  dashboardA: LoadTestResultDashboardResponse;
  dashboardB: LoadTestResultDashboardResponse;
};

export function CompareByUrlTable({
  dashboardA,
  dashboardB,
}: CompareByUrlTableProps) {
  const rows = mergeByUrlForCompare(
    dashboardA.by_url ?? [],
    dashboardB.by_url ?? [],
  );

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No per-URL data to compare.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Endpoint</TableHead>
            <TableHead className="text-right">A avg</TableHead>
            <TableHead className="text-right">B avg</TableHead>
            <TableHead className="text-right">Δ avg</TableHead>
            <TableHead className="text-right">A err%</TableHead>
            <TableHead className="text-right">B err%</TableHead>
            <TableHead className="text-right">Δ err%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const avgDelta = formatDelta(row.a?.avg_ms, row.b?.avg_ms, {
              higherIsWorse: true,
              suffix: " ms",
              decimals: 0,
            });
            const errDelta = formatDelta(
              row.a?.error_rate_percent,
              row.b?.error_rate_percent,
              { higherIsWorse: true, suffix: "%", decimals: 2 },
            );

            return (
              <TableRow key={row.key}>
                <TableCell className="max-w-[220px] truncate pl-4 font-medium text-sm">
                  <span className="text-muted-foreground">{row.method}</span>{" "}
                  {row.url}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {row.a?.avg_ms != null
                    ? `${row.a.avg_ms.toFixed(0)} ms`
                    : "—"}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {row.b?.avg_ms != null
                    ? `${row.b.avg_ms.toFixed(0)} ms`
                    : "—"}
                </TableCell>
                <TableCell className="text-right text-sm">
                  <DeltaCell delta={avgDelta} />
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {row.a?.error_rate_percent != null
                    ? `${row.a.error_rate_percent.toFixed(2)}%`
                    : "—"}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {row.b?.error_rate_percent != null
                    ? `${row.b.error_rate_percent.toFixed(2)}%`
                    : "—"}
                </TableCell>
                <TableCell className="text-right text-sm">
                  <DeltaCell delta={errDelta} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function DeltaCell({ delta }: { delta: ReturnType<typeof formatDelta> }) {
  if (!delta) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "tabular-nums",
        delta.regression && "font-medium text-destructive",
      )}
    >
      {delta.absolute}
    </span>
  );
}
