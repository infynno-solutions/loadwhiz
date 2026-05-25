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
import type { ColumnDef } from "@tanstack/react-table";
import {
  EyeIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import type { HostResponse } from "@/api/generated/types.gen";
import { HostStatusBadge } from "@/components/hosts/host-status-badge";
import { formatHostDate } from "@/lib/host-queries";

export type HostsTableMeta = {
  onView: (host: HostResponse) => void;
  onDelete: (host: HostResponse) => void;
  onVerify: (host: HostResponse) => void;
  onRetry: (host: HostResponse) => void;
  actionHostId: string | null;
  actionType: "verify" | "retry" | "delete" | null;
};

export const hostsColumns: ColumnDef<HostResponse>[] = [
  {
    accessorKey: "hostname",
    header: "Hostname",
    cell: ({ row, table }) => {
      const meta = table.options.meta as HostsTableMeta | undefined;
      return (
        <button
          type="button"
          className="text-left font-medium hover:underline"
          onClick={() => meta?.onView(row.original)}
        >
          {row.original.hostname}
        </button>
      );
    },
  },
  {
    accessorKey: "verification_method",
    header: "Method",
    cell: ({ row }) => (
      <span className="uppercase">{row.original.verification_method}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <HostStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "verification_deadline",
    header: "Deadline",
    cell: ({ row }) => formatHostDate(row.original.verification_deadline),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => formatHostDate(row.original.created_at),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      const host = row.original;
      const meta = table.options.meta as HostsTableMeta | undefined;
      const isBusy = meta?.actionHostId === host.id;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Actions for ${host.hostname}`}
              />
            }
          >
            {isBusy ? <Spinner /> : <MoreHorizontalIcon />}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => meta?.onView(host)}>
                <EyeIcon />
                View details
              </DropdownMenuItem>
              {host.status === "pending" && (
                <DropdownMenuItem
                  disabled={isBusy}
                  onClick={() => meta?.onVerify(host)}
                >
                  <ShieldCheckIcon />
                  Verify now
                </DropdownMenuItem>
              )}
              {host.status === "failed" && (
                <DropdownMenuItem
                  disabled={isBusy}
                  onClick={() => meta?.onRetry(host)}
                >
                  <RefreshCwIcon />
                  Retry verification
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={isBusy}
              onClick={() => meta?.onDelete(host)}
            >
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
