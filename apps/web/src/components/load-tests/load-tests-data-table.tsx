"use client";

import { Skeleton } from "@loadwhiz/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@loadwhiz/ui/components/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  loadTestsRunMutation,
  loadTestsStopMutation,
} from "@/api/generated/@tanstack/react-query.gen";
import type { LoadTestResponse } from "@/api/generated/types.gen";
import {
  type LoadTestsTableMeta,
  loadTestsColumns,
} from "@/components/load-tests/load-tests-columns";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  applyRunStartedOptimisticUpdates,
  invalidateLoadTestQueries,
} from "@/lib/load-test-queries";

type LoadTestsDataTableProps = {
  orgId: string;
  tests: LoadTestResponse[];
  hostNameById: Map<string, string>;
  isLoading?: boolean;
  onDelete: (test: LoadTestResponse) => void;
};

export function LoadTestsDataTable({
  orgId,
  tests,
  hostNameById,
  isLoading,
  onDelete,
}: LoadTestsDataTableProps) {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [actionTestId, setActionTestId] = useState<string | null>(null);
  const [actionType, setActionType] =
    useState<LoadTestsTableMeta["actionType"]>(null);

  const runTest = useMutation(loadTestsRunMutation());
  const stopTest = useMutation(loadTestsStopMutation());

  const runAction = useCallback(
    async (
      test: LoadTestResponse,
      type: NonNullable<LoadTestsTableMeta["actionType"]>,
      fn: () => Promise<unknown>,
      successMessage: string,
      errorMessage: string,
      onSuccess?: (data: unknown) => void,
    ) => {
      setActionTestId(test.test_id);
      setActionType(type);
      try {
        const data = await fn();
        onSuccess?.(data);
        if (type === "run" || type === "stop") {
          await invalidateLoadTestQueries(queryClient, orgId, test.test_id);
        }
        toast.success(successMessage);
      } catch (error) {
        toast.error(getApiErrorMessage(error, errorMessage));
      } finally {
        setActionTestId(null);
        setActionType(null);
      }
    },
    [orgId, queryClient],
  );

  const meta = useMemo<LoadTestsTableMeta>(
    () => ({
      hostNameById,
      actionTestId,
      actionType,
      onDelete,
      onRun: (test) =>
        void runAction(
          test,
          "run",
          () =>
            runTest.mutateAsync({
              path: { org_id: orgId, test_id: test.test_id },
            }),
          "Load test started.",
          "Could not start load test.",
          (run) =>
            applyRunStartedOptimisticUpdates(
              queryClient,
              orgId,
              test.test_id,
              run as Awaited<ReturnType<typeof runTest.mutateAsync>>,
            ),
        ),
      onStop: (test) =>
        void runAction(
          test,
          "stop",
          () =>
            stopTest.mutateAsync({
              path: { org_id: orgId, test_id: test.test_id },
            }),
          "Load test stopped.",
          "Could not stop load test.",
        ),
    }),
    [
      hostNameById,
      actionTestId,
      actionType,
      onDelete,
      orgId,
      runTest,
      stopTest,
      runAction,
      queryClient,
    ],
  );

  const table = useReactTable({
    data: tests,
    columns: loadTestsColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
