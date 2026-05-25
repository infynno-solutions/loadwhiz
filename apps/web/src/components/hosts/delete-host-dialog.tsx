"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@loadwhiz/ui/components/alert-dialog";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { hostsDeleteMutation } from "@/api/generated/@tanstack/react-query.gen";
import type { HostResponse } from "@/api/generated/types.gen";
import { getApiErrorMessage } from "@/lib/api-errors";
import { hostsListQueryKeyForOrg } from "@/lib/host-queries";

type DeleteHostDialogProps = {
  host: HostResponse | null;
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteHostDialog({
  host,
  orgId,
  open,
  onOpenChange,
  onDeleted,
}: DeleteHostDialogProps) {
  const queryClient = useQueryClient();
  const deleteHost = useMutation(hostsDeleteMutation());

  const handleDelete = async () => {
    if (!host) return;

    try {
      await deleteHost.mutateAsync({
        path: { org_id: orgId, host_id: host.id },
      });
      await queryClient.invalidateQueries({
        queryKey: hostsListQueryKeyForOrg(orgId),
      });
      toast.success("Host deleted");
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete host."));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete host?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes <span className="font-medium">{host?.hostname}</span>{" "}
            and any associated load test configurations. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteHost.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteHost.isPending}
            onClick={() => void handleDelete()}
          >
            {deleteHost.isPending ? <Spinner /> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
