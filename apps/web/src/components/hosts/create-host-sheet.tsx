"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@loadwhiz/ui/components/field";
import { Input } from "@loadwhiz/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
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
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { hostsCreateMutation } from "@/api/generated/@tanstack/react-query.gen";
import { getApiErrorMessage } from "@/lib/api-errors";
import { hostsListQueryKeyForOrg } from "@/lib/host-queries";
import {
  type CreateHostFormValues,
  createHostSchema,
  VERIFICATION_METHOD_OPTIONS,
} from "@/schemas/hosts";

type CreateHostSheetProps = {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function CreateHostSheet({
  orgId,
  open,
  onOpenChange,
  onCreated,
}: CreateHostSheetProps) {
  const queryClient = useQueryClient();
  const createHost = useMutation(hostsCreateMutation());

  const form = useForm({
    defaultValues: {
      url: "",
      verification_method: "dns",
    } satisfies CreateHostFormValues,
    validators: {
      onSubmit: createHostSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await createHost.mutateAsync({
          path: { org_id: orgId },
          body: value,
        });
        await queryClient.invalidateQueries({
          queryKey: hostsListQueryKeyForOrg(orgId),
        });
        toast.success("Host registered");
        form.reset();
        onOpenChange(false);
        onCreated?.();
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not register host."));
      }
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add host</SheetTitle>
          <SheetDescription>
            Register a domain for ownership verification before using it in load
            tests.
          </SheetDescription>
        </SheetHeader>
        <form
          id="create-host-form"
          className="flex flex-1 flex-col px-4"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="url">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Hostname or URL
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="api.example.com"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="verification_method">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Verification method
                    </FieldLabel>
                    <Select
                      items={[...VERIFICATION_METHOD_OPTIONS]}
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(
                          value as CreateHostFormValues["verification_method"],
                        )
                      }
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="dns">DNS TXT record</SelectItem>
                          <SelectItem value="http">HTTP file</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </form>
        <SheetFooter className="mt-0 flex flex-row justify-end gap-2 border-t px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={createHost.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-host-form"
            size="sm"
            disabled={createHost.isPending}
          >
            {createHost.isPending ? <Spinner /> : "Register host"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
