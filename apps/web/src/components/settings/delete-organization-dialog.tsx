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
import { Input } from "@loadwhiz/ui/components/input";
import { Label } from "@loadwhiz/ui/components/label";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useState } from "react";

type DeleteOrganizationDialogProps = {
  organizationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onConfirm: () => void;
};

export function DeleteOrganizationDialog({
  organizationName,
  open,
  onOpenChange,
  isDeleting,
  onConfirm,
}: DeleteOrganizationDialogProps) {
  const [confirmName, setConfirmName] = useState("");

  const canConfirm = confirmName.trim() === organizationName;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmName("");
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete organization?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Type{" "}
            <span className="font-medium text-foreground">
              {organizationName}
            </span>{" "}
            to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 px-4">
          <Label htmlFor="confirm-org-name">Organization name</Label>
          <Input
            id="confirm-org-name"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={organizationName}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!canConfirm || isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? <Spinner /> : "Delete organization"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
