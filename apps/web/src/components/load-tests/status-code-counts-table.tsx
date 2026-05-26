"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@loadwhiz/ui/components/table";
import type { DashboardStatusCodeCount } from "@/api/generated/types.gen";

type StatusCodeCountsTableProps = {
  rows: DashboardStatusCodeCount[];
  totalRequests?: number;
};

function formatStatusLabel(status: string): string {
  if (!status || status === "0") {
    return "Timeout / no response";
  }
  return status;
}

function statusBadgeVariant(
  status: string,
): "success" | "destructive" | "warning" | "secondary" {
  if (!status || status === "0") {
    return "warning";
  }
  const code = Number.parseInt(status, 10);
  if (Number.isNaN(code)) {
    return "secondary";
  }
  if (code >= 200 && code < 400) {
    return "success";
  }
  if (code >= 500) {
    return "destructive";
  }
  if (code >= 400) {
    return "warning";
  }
  return "secondary";
}

export function StatusCodeCountsTable({
  rows,
  totalRequests,
}: StatusCodeCountsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Status breakdown appears once requests are recorded.
      </p>
    );
  }

  const total =
    totalRequests ?? rows.reduce((sum, row) => sum + (row.count ?? 0), 0);

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Requests</TableHead>
            <TableHead className="text-right">Share</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const count = row.count ?? 0;
            const share =
              total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "—";
            const label = formatStatusLabel(row.status);
            return (
              <TableRow key={row.status}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={statusBadgeVariant(row.status)}
                      className="font-mono text-xs tabular-nums"
                    >
                      {row.status === "0" || !row.status ? "—" : row.status}
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      {label}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {count.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {share}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
