"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@loadwhiz/ui/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loadwhiz/ui/components/select";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";

import type { MemberResponse } from "@/api/generated/types.gen";
import { RoleBadge } from "@/components/settings/role-badge";

export type MembersTableMeta = {
  currentUserId: string;
  canChangeRoles: boolean;
  canRemoveMembers: boolean;
  onRoleChange: (member: MemberResponse, role: "admin" | "member") => void;
  onRemove: (member: MemberResponse) => void;
  actionUserId: string | null;
};

function formatJoinedAt(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const membersColumns: ColumnDef<MemberResponse>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-muted-foreground text-xs">
          {row.original.email}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row, table }) => {
      const meta = table.options.meta as MembersTableMeta | undefined;
      const member = row.original;
      const isOwner = member.role === "owner";
      const isSelf = member.user_id === meta?.currentUserId;
      const canEdit =
        meta?.canChangeRoles && !isOwner && !isSelf && member.role !== "owner";

      if (!canEdit) {
        return <RoleBadge role={member.role} />;
      }

      return (
        <Select
          value={member.role === "admin" ? "admin" : "member"}
          onValueChange={(value) => {
            if (value === "admin" || value === "member") {
              meta?.onRoleChange(member, value);
            }
          }}
          disabled={meta?.actionUserId === member.user_id}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      );
    },
  },
  {
    accessorKey: "joined_at",
    header: "Joined",
    cell: ({ row }) => formatJoinedAt(row.original.joined_at),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as MembersTableMeta | undefined;
      const member = row.original;
      const isOwner = member.role === "owner";
      const isSelf = member.user_id === meta?.currentUserId;
      const canRemove = meta?.canRemoveMembers && !isOwner && !isSelf;
      const isBusy = meta?.actionUserId === member.user_id;

      if (!canRemove) return null;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-8">
                {isBusy ? (
                  <Spinner className="size-4" />
                ) : (
                  <MoreHorizontalIcon className="size-4" />
                )}
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => meta?.onRemove(member)}
            >
              <Trash2Icon className="size-4" />
              Remove member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
