"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import { Button } from "@loadwhiz/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import { Link } from "@tanstack/react-router";
import { ArrowLeftRightIcon } from "lucide-react";
import type { LoadTestResultDashboardResponse } from "@/api/generated/types.gen";
import { LoadTestResultStatusBadge } from "@/components/load-tests/load-test-result-status-badge";
import { formatLoadTestDate } from "@/lib/load-test-actions";

type CompareRunCardsProps = {
  testId: string;
  dashboardA: LoadTestResultDashboardResponse;
  dashboardB: LoadTestResultDashboardResponse;
  onSwap: () => void;
};

function RunCard({
  title,
  dashboard,
  testId,
}: {
  title: string;
  dashboard: LoadTestResultDashboardResponse;
  testId: string;
}) {
  const { meta } = dashboard;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="font-medium text-sm">{meta.test_name}</p>
        <div className="flex flex-wrap items-center gap-2">
          <LoadTestResultStatusBadge status={meta.status} />
          {meta.passed != null ? (
            <Badge variant={meta.passed ? "success" : "destructive"}>
              {meta.passed ? "Passed" : "Failed"}
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">
          {formatLoadTestDate(meta.started_at)}
          {meta.finished_at
            ? ` → ${formatLoadTestDate(meta.finished_at)}`
            : null}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="w-fit px-0"
          render={
            <Link
              to="/app/tests/$testId/results/$resultId"
              params={{ testId, resultId: meta.result_id }}
            />
          }
        >
          View full result
        </Button>
      </CardContent>
    </Card>
  );
}

export function CompareRunCards({
  testId,
  dashboardA,
  dashboardB,
  onSwap,
}: CompareRunCardsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={onSwap}>
          <ArrowLeftRightIcon />
          Swap A ↔ B
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <RunCard title="Run A" dashboard={dashboardA} testId={testId} />
        <RunCard title="Run B" dashboard={dashboardB} testId={testId} />
      </div>
    </div>
  );
}
