"use client";

import { Button } from "@loadwhiz/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@loadwhiz/ui/components/field";
import { Input } from "@loadwhiz/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loadwhiz/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@loadwhiz/ui/components/sheet";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  organizationsInvitesCreateMutation,
  organizationsInvitesListOptions,
} from "@/api/generated/@tanstack/react-query.gen";
import { getApiErrorMessage } from "@/lib/api-errors";

type InviteMemberSheetProps = {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteMemberSheet({
  orgId,
  open,
  onOpenChange,
}: InviteMemberSheetProps) {
  const queryClient = useQueryClient();
  const createInvite = useMutation(organizationsInvitesCreateMutation());
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    try {
      await createInvite.mutateAsync({
        path: { org_id: orgId },
        body: { email: trimmed, role },
      });
      await queryClient.invalidateQueries({
        queryKey: organizationsInvitesListOptions({ path: { org_id: orgId } })
          .queryKey,
      });
      toast.success("Invitation sent");
      setEmail("");
      setRole("member");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not send invitation."));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Invite member</SheetTitle>
          <SheetDescription>
            Send an email invitation to join this organization.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-role">Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(value) => {
                  if (value === "admin" || value === "member") {
                    setRole(value);
                  }
                }}
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </div>
        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createInvite.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleInvite()}
            disabled={createInvite.isPending}
          >
            {createInvite.isPending ? <Spinner /> : "Send invitation"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
