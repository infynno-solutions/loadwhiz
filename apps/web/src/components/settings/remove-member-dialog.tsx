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

import type { MemberResponse } from "@/api/generated/types.gen";

type RemoveMemberDialogProps = {
  member: MemberResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRemoving: boolean;
  onConfirm: () => void;
};

export function RemoveMemberDialog({
  member,
  open,
  onOpenChange,
  isRemoving,
  onConfirm,
}: RemoveMemberDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove member?</AlertDialogTitle>
          <AlertDialogDescription>
            {member
              ? `${member.name} (${member.email}) will lose access to this organization.`
              : "This member will lose access to this organization."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isRemoving}
            onClick={onConfirm}
          >
            {isRemoving ? <Spinner /> : "Remove member"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
