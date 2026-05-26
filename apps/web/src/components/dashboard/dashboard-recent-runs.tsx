"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import { Button } from "@loadwhiz/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@loadwhiz/ui/components/table";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, FlaskConicalIcon } from "lucide-react";
import type { OrgDashboardRecentRun } from "@/api/generated/types.gen";
import { LoadTestResultStatusBadge } from "@/components/load-tests/load-test-result-status-badge";
import {
  canViewResultDetail,
  formatLoadTestDate,
} from "@/lib/load-test-actions";

function PassCell({ passed }: { passed?: boolean | null }) {
  if (passed === true) return <Badge variant="success">Pass</Badge>;
  if (passed === false) return <Badge variant="destructive">Fail</Badge>;
  return <span className="text-muted-foreground/50">—</span>;
}

type DashboardRecentRunsProps = {
  runs: OrgDashboardRecentRun[];
};

export function DashboardRecentRuns({ runs }: DashboardRecentRunsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent runs</CardTitle>
      </CardHeader>

      {runs.length === 0 ? (
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FlaskConicalIcon className="size-5" />
            </div>
            <p className="font-medium text-sm">No runs yet</p>
            <p className="text-muted-foreground text-xs">
              Run a load test to see results here.
            </p>
          </div>
        </CardContent>
      ) : (
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Test</TableHead>
                <TableHead className="hidden sm:table-cell">Host</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="hidden md:table-cell">RPS</TableHead>
                <TableHead className="hidden md:table-cell">
                  Error rate
                </TableHead>
                <TableHead className="hidden lg:table-cell">Started</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const canLink = canViewResultDetail(
                  run.status as Parameters<typeof canViewResultDetail>[0],
                );

                return (
                  <TableRow key={run.result_id}>
                    <TableCell className="pl-4">
                      <Link
                        to="/app/tests/$testId"
                        params={{ testId: run.test_id }}
                        className="font-medium text-sm hover:underline"
                      >
                        {run.test_name}
                      </Link>
                      {/* host shown inline on small screens */}
                      <p className="text-muted-foreground text-xs sm:hidden">
                        {run.host_hostname}
                      </p>
                    </TableCell>

                    <TableCell className="hidden text-muted-foreground text-sm sm:table-cell">
                      {run.host_hostname}
                    </TableCell>

                    <TableCell>
                      <LoadTestResultStatusBadge
                        status={
                          run.status as Parameters<
                            typeof LoadTestResultStatusBadge
                          >[0]["status"]
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <PassCell passed={run.passed} />
                    </TableCell>

                    <TableCell className="hidden text-sm tabular-nums md:table-cell">
                      {run.metrics?.rps != null ? (
                        `${run.metrics.rps.toFixed(1)}`
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    <TableCell className="hidden text-sm tabular-nums md:table-cell">
                      {run.metrics?.error_rate_percent != null ? (
                        <span
                          className={
                            run.metrics.error_rate_percent > 5
                              ? "font-medium text-destructive"
                              : undefined
                          }
                        >
                          {run.metrics.error_rate_percent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    <TableCell className="hidden text-muted-foreground text-xs lg:table-cell">
                      {formatLoadTestDate(run.started_at)}
                    </TableCell>

                    <TableCell className="pr-2 text-right">
                      {canLink ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="View result"
                          render={
                            <Link
                              to="/app/tests/$testId/results/$resultId"
                              params={{
                                testId: run.test_id,
                                resultId: run.result_id,
                              }}
                            />
                          }
                        >
                          <ArrowRightIcon />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}
