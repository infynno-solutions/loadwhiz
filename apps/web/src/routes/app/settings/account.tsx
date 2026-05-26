"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import { Button } from "@loadwhiz/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@loadwhiz/ui/components/field";
import { Input } from "@loadwhiz/ui/components/input";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  usersMeQueryKey,
  usersUpdateMeMutation,
} from "@/api/generated/@tanstack/react-query.gen";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { useResendVerificationEmail } from "@/hooks/use-resend-verification-email";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useCurrentUser } from "@/lib/user-queries";

const accountSchema = z.object({
  name: z.string().min(1, "Name is required."),
});

export const Route = createFileRoute("/app/settings/account")({
  staticData: {
    breadcrumb: "Account",
  },
  component: AccountSettingsPage,
});

function AccountSettingsPage() {
  const queryClient = useQueryClient();
  const { data: user, isPending } = useCurrentUser();
  const updateMe = useMutation(usersUpdateMeMutation());
  const { resend, isPending: isResending } = useResendVerificationEmail();

  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: accountSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateMe.mutateAsync({ body: { name: value.name } });
        await queryClient.invalidateQueries({ queryKey: usersMeQueryKey() });
        toast.success("Profile updated");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not update profile."));
      }
    },
  });

  useEffect(() => {
    if (user?.name) {
      form.setFieldValue("name", user.name);
    }
  }, [user?.name, form]);

  if (isPending || !user) {
    return <Spinner className="mx-auto size-6" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsPageHeader
        title="Account"
        description="Manage your personal profile and email verification status."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="name"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="account-name">Full name</FieldLabel>
                      <Input
                        id="account-name"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </Field>
                  );
                }}
              />
              <Field>
                <FieldLabel htmlFor="account-email">Email</FieldLabel>
                <Input id="account-email" value={user.email} disabled />
              </Field>
              <Field>
                <FieldLabel>Verification</FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  {user.is_email_verified ? (
                    <Badge variant="secondary">Verified</Badge>
                  ) : (
                    <>
                      <Badge variant="outline">Unverified</Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isResending}
                        onClick={() => void resend()}
                      >
                        {isResending ? (
                          <Spinner />
                        ) : (
                          "Resend verification email"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </Field>
              <Button type="submit" disabled={updateMe.isPending}>
                {updateMe.isPending ? <Spinner /> : "Save changes"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
