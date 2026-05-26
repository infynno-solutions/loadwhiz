"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import { Button } from "@loadwhiz/ui/components/button";
import { Checkbox } from "@loadwhiz/ui/components/checkbox";
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
import { EyeIcon, GitCompareArrowsIcon, PlayIcon } from "lucide-react";
import type { LoadTestResultSummary } from "@/api/generated/types.gen";
import { LoadTestResultStatusBadge } from "@/components/load-tests/load-test-result-status-badge";
import {
  canCompareResult,
  canViewResultDetail,
  formatLoadTestDate,
  resultDetailLinkLabel,
} from "@/lib/load-test-actions";

type LoadTestResultsTableProps = {
  testId: string;
  results: LoadTestResultSummary[];
  isLoading?: boolean;
  compareMode?: boolean;
  selectedResultIds?: string[];
  onToggleCompareSelect?: (resultId: string) => void;
};

export function LoadTestResultsTable({
  testId,
  results,
  isLoading,
  compareMode = false,
  selectedResultIds = [],
  onToggleCompareSelect,
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
            Start a run from the header when this test is ready. Each run links
            to live progress or the full results dashboard.
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
            {compareMode ? <TableHead className="w-10 pl-4" /> : null}
            <TableHead className={compareMode ? undefined : "pl-4"}>
              Status
            </TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Finished</TableHead>
            <TableHead>RPS</TableHead>
            <TableHead>Error rate</TableHead>
            <TableHead>Details</TableHead>
            {!compareMode ? <TableHead /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => {
            const selectable = canCompareResult(result.status);
            const selected = selectedResultIds.includes(result.result_id);

            return (
              <TableRow
                key={result.result_id}
                className={selected ? "bg-muted/50" : undefined}
              >
                {compareMode ? (
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selected}
                      disabled={!selectable}
                      aria-label={`Select run ${result.result_id} for comparison`}
                      onCheckedChange={() =>
                        onToggleCompareSelect?.(result.result_id)
                      }
                    />
                  </TableCell>
                ) : null}
                <TableCell className={compareMode ? undefined : "pl-4"}>
                  <LoadTestResultStatusBadge status={result.status} />
                </TableCell>
                <TableCell>
                  {result.passed == null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <Badge variant={result.passed ? "success" : "destructive"}>
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
                <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                  {result.error_message ?? "—"}
                </TableCell>
                {!compareMode ? (
                  <TableCell className="text-right">
                    {canViewResultDetail(result.status) ? (
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
                        {resultDetailLinkLabel(result.status)}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {compareMode ? (
        <p className="border-t bg-muted/30 px-4 py-2 text-muted-foreground text-xs">
          Select two completed runs to compare metrics side by side. Live or
          in-progress runs cannot be compared.
        </p>
      ) : null}
    </div>
  );
}

export function CompareRunsToolbar({
  compareMode,
  onCompareModeChange,
  selectedCount,
  onCompare,
  disabled,
}: {
  compareMode: boolean;
  onCompareModeChange: (enabled: boolean) => void;
  selectedCount: number;
  onCompare: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button
        variant={compareMode ? "secondary" : "outline"}
        size="sm"
        onClick={() => onCompareModeChange(!compareMode)}
      >
        <GitCompareArrowsIcon />
        {compareMode ? "Cancel compare" : "Compare runs"}
      </Button>
      {compareMode ? (
        <Button
          size="sm"
          disabled={selectedCount !== 2 || disabled}
          onClick={onCompare}
        >
          Compare selected ({selectedCount}/2)
        </Button>
      ) : null}
    </div>
  );
}
