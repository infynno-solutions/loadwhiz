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

import { loadTestsDeleteMutation } from "@/api/generated/@tanstack/react-query.gen";
import type { LoadTestResponse } from "@/api/generated/types.gen";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  getLoadTestDisplayName,
  loadTestsGetQueryKeyFor,
  loadTestsListQueryKeyForOrg,
} from "@/lib/load-test-queries";

type DeleteLoadTestDialogProps = {
  orgId: string;
  test: LoadTestResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteLoadTestDialog({
  orgId,
  test,
  open,
  onOpenChange,
  onDeleted,
}: DeleteLoadTestDialogProps) {
  const queryClient = useQueryClient();
  const deleteTest = useMutation(loadTestsDeleteMutation());

  const handleDelete = async () => {
    if (!test) return;
    try {
      await deleteTest.mutateAsync({
        path: { org_id: orgId, test_id: test.test_id },
      });
      await queryClient.invalidateQueries({
        queryKey: loadTestsListQueryKeyForOrg(orgId),
      });
      queryClient.removeQueries({
        queryKey: loadTestsGetQueryKeyFor(orgId, test.test_id),
      });
      toast.success("Load test deleted.");
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete load test."));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete load test?</AlertDialogTitle>
          <AlertDialogDescription>
            {test
              ? `“${getLoadTestDisplayName(test)}” will be permanently removed. Stop any active run first.`
              : "This load test will be permanently removed."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTest.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteTest.isPending}
            onClick={() => void handleDelete()}
          >
            {deleteTest.isPending ? <Spinner /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
