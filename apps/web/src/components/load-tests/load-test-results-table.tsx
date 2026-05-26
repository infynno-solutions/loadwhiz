"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import { Button } from "@loadwhiz/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@loadwhiz/ui/components/empty";
import { Skeleton } from "@loadwhiz/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@loadwhiz/ui/components/table";
import { Link } from "@tanstack/react-router";
import { EyeIcon, PlayIcon } from "lucide-react";
import type { LoadTestResultSummary } from "@/api/generated/types.gen";
import { LoadTestResultStatusBadge } from "@/components/load-tests/load-test-result-status-badge";
import {
  canViewResultDashboard,
  formatLoadTestDate,
} from "@/lib/load-test-actions";

type LoadTestResultsTableProps = {
  testId: string;
  results: LoadTestResultSummary[];
  isLoading?: boolean;
};

export function LoadTestResultsTable({
  testId,
  results,
  isLoading,
}: LoadTestResultsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PlayIcon />
          </EmptyMedia>
          <EmptyTitle>No runs yet</EmptyTitle>
          <EmptyDescription>
            Start a run from the header when this test is ready. Passed runs
            will appear here with a link to the results dashboard.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Finished</TableHead>
            <TableHead>RPS</TableHead>
            <TableHead>Error rate</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.result_id}>
              <TableCell>
                <LoadTestResultStatusBadge status={result.status} />
              </TableCell>
              <TableCell>
                {result.passed == null ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <Badge variant={result.passed ? "secondary" : "destructive"}>
                    {result.passed ? "Passed" : "Failed"}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{formatLoadTestDate(result.started_at)}</TableCell>
              <TableCell>{formatLoadTestDate(result.finished_at)}</TableCell>
              <TableCell>
                {result.metrics?.rps != null
                  ? result.metrics.rps.toFixed(2)
                  : "—"}
              </TableCell>
              <TableCell>
                {result.metrics?.error_rate_percent != null
                  ? `${result.metrics.error_rate_percent.toFixed(1)}%`
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                {canViewResultDashboard(result.status, result.passed) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link
                        to="/app/tests/$testId/results/$resultId"
                        params={{
                          testId,
                          resultId: result.result_id,
                        }}
                      />
                    }
                  >
                    <EyeIcon />
                    View result
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
