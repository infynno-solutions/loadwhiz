"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@loadwhiz/ui/components/table";
import type { DashboardByUrl } from "@/api/generated/types.gen";

type ByUrlTableProps = {
  rows: DashboardByUrl[];
};

export function ByUrlTable({ rows }: ByUrlTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No per-URL breakdown yet.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>URL</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Requests</TableHead>
            <TableHead>Avg (ms)</TableHead>
            <TableHead>Error rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.method}-${row.url}`}>
              <TableCell className="max-w-xs truncate font-mono text-xs">
                {row.url}
              </TableCell>
              <TableCell>{row.method}</TableCell>
              <TableCell>{row.requests ?? "—"}</TableCell>
              <TableCell>
                {row.avg_ms != null ? row.avg_ms.toFixed(0) : "—"}
              </TableCell>
              <TableCell>
                {row.error_rate_percent != null
                  ? `${row.error_rate_percent.toFixed(1)}%`
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
