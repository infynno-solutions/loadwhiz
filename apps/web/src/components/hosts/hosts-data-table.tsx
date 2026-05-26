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
  hostsRetryMutation,
  hostsVerifyMutation,
} from "@/api/generated/@tanstack/react-query.gen";
import type { HostResponse } from "@/api/generated/types.gen";
import {
  type HostsTableMeta,
  hostsColumns,
} from "@/components/hosts/hosts-columns";
import { getApiErrorMessage } from "@/lib/api-errors";
import { hostsListQueryKeyForOrg } from "@/lib/host-queries";

type HostsDataTableProps = {
  orgId: string;
  hosts: HostResponse[];
  isLoading?: boolean;
  onView: (host: HostResponse) => void;
  onDelete: (host: HostResponse) => void;
};

export function HostsDataTable({
  orgId,
  hosts,
  isLoading,
  onView,
  onDelete,
}: HostsDataTableProps) {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [actionHostId, setActionHostId] = useState<string | null>(null);
  const [actionType, setActionType] =
    useState<HostsTableMeta["actionType"]>(null);

  const verifyHost = useMutation(hostsVerifyMutation());
  const retryHost = useMutation(hostsRetryMutation());

  const runAction = useCallback(
    async (
      host: HostResponse,
      type: NonNullable<HostsTableMeta["actionType"]>,
      fn: () => Promise<unknown>,
      successMessage: string,
      errorMessage: string,
    ) => {
      setActionHostId(host.id);
      setActionType(type);
      try {
        await fn();
        await queryClient.invalidateQueries({
          queryKey: hostsListQueryKeyForOrg(orgId),
        });
        toast.success(successMessage);
      } catch (error) {
        toast.error(getApiErrorMessage(error, errorMessage));
      } finally {
        setActionHostId(null);
        setActionType(null);
      }
    },
    [orgId, queryClient],
  );

  const meta = useMemo<HostsTableMeta>(
    () => ({
      onView,
      onDelete,
      onVerify: (host) =>
        void runAction(
          host,
          "verify",
          () =>
            verifyHost.mutateAsync({
              path: { org_id: orgId, host_id: host.id },
            }),
          "Verification check completed",
          "Could not verify host.",
        ),
      onRetry: (host) =>
        void runAction(
          host,
          "retry",
          () =>
            retryHost.mutateAsync({
              path: { org_id: orgId, host_id: host.id },
            }),
          "Verification restarted",
          "Could not retry verification.",
        ),
      actionHostId,
      actionType,
    }),
    [
      onView,
      onDelete,
      orgId,
      actionHostId,
      actionType,
      verifyHost,
      retryHost,
      runAction,
    ],
  );

  const table = useReactTable({
    data: hosts,
    columns: hostsColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              {hostsColumns.map((col) => (
                <TableHead
                  key={
                    col.id ??
                    ("accessorKey" in col ? String(col.accessorKey) : "col")
                  }
                >
                  {typeof col.header === "string" ? col.header : null}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {hostsColumns.map((col) => (
                  <TableCell key={col.id ?? String(col.accessorKey)}>
                    <Skeleton className="h-4 w-full max-w-32" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
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
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={hostsColumns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No hosts found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
