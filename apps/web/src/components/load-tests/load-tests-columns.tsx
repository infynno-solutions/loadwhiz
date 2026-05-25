"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@loadwhiz/ui/components/dropdown-menu";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  EyeIcon,
  MoreHorizontalIcon,
  PlayIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";
import type { LoadTestResponse } from "@/api/generated/types.gen";
import { LoadTestResultStatusBadge } from "@/components/load-tests/load-test-result-status-badge";
import { LoadTestStatusBadge } from "@/components/load-tests/load-test-status-badge";
import {
  canDeleteLoadTest,
  canRunLoadTest,
  canStopLoadTest,
  formatLoadTestDate,
} from "@/lib/load-test-actions";
import { getLoadTestDisplayName } from "@/lib/load-test-queries";

export type LoadTestsTableMeta = {
  hostNameById: Map<string, string>;
  onRun: (test: LoadTestResponse) => void;
  onStop: (test: LoadTestResponse) => void;
  onDelete: (test: LoadTestResponse) => void;
  actionTestId: string | null;
  actionType: "run" | "stop" | "delete" | null;
};

export const loadTestsColumns: ColumnDef<LoadTestResponse>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const test = row.original;
      return (
        <Link
          to="/app/tests/$testId"
          params={{ testId: test.test_id }}
          className="cursor-pointer font-medium hover:underline"
        >
          {getLoadTestDisplayName(test)}
        </Link>
      );
    },
  },
  {
    id: "host",
    header: "Host",
    cell: ({ row, table }) => {
      const meta = table.options.meta as LoadTestsTableMeta | undefined;
      return (
        meta?.hostNameById.get(row.original.host_id) ?? row.original.host_id
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <LoadTestStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "url_source",
    header: "Source",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.url_source}</span>
    ),
  },
  {
    accessorKey: "test_type",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.test_type}
      </span>
    ),
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => `${row.original.duration}s`,
  },
  {
    accessorKey: "total",
    header: "Clients",
  },
  {
    id: "latest_run",
    header: "Latest run",
    cell: ({ row }) => {
      const latest = row.original.latest_result;
      if (!latest) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col gap-0.5">
          <LoadTestResultStatusBadge status={latest.status} />
          {latest.metrics?.rps != null && (
            <span className="text-muted-foreground text-xs">
              {latest.metrics.rps.toFixed(1)} rps
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "updated_at",
    header: "Updated",
    cell: ({ row }) => formatLoadTestDate(row.original.updated_at),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      const test = row.original;
      const meta = table.options.meta as LoadTestsTableMeta | undefined;
      const isBusy = meta?.actionTestId === test.test_id;

      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="View test"
            render={
              <Link to="/app/tests/$testId" params={{ testId: test.test_id }} />
            }
          >
            <EyeIcon />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="More actions"
                />
              }
            >
              {isBusy ? <Spinner /> : <MoreHorizontalIcon />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={!canRunLoadTest(test.status) || isBusy}
                  onClick={() => meta?.onRun(test)}
                >
                  <PlayIcon />
                  Run
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canStopLoadTest(test.status) || isBusy}
                  onClick={() => meta?.onStop(test)}
                >
                  <SquareIcon />
                  Stop
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={!canDeleteLoadTest(test.status) || isBusy}
                onClick={() => meta?.onDelete(test)}
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
