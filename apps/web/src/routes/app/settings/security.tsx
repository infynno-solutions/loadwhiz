"use client";

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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@loadwhiz/ui/components/field";
import { InputPassword } from "@loadwhiz/ui/components/input-password";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

import { usersChangePasswordMutation } from "@/api/generated/@tanstack/react-query.gen";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { getApiErrorMessage } from "@/lib/api-errors";
import { signOut } from "@/lib/auth-api";

const securitySchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const Route = createFileRoute("/app/settings/security")({
  staticData: {
    breadcrumb: "Security",
  },
  component: SecuritySettingsPage,
});

function SecuritySettingsPage() {
  const navigate = useNavigate();
  const changePassword = useMutation(usersChangePasswordMutation());

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: securitySchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const data = await changePassword.mutateAsync({
          body: {
            current_password: value.currentPassword,
            new_password: value.newPassword,
          },
        });
        toast.success(data?.message ?? "Password changed");
        await signOut();
        navigate({ to: "/login" });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not change password."));
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <SettingsPageHeader
        title="Security"
        description="Update your password and manage account access."
      />

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            You will be signed out on all devices after changing your password.
          </CardDescription>
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
                name="currentPassword"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="current-password">
                        Current password
                      </FieldLabel>
                      <InputPassword
                        id="current-password"
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
              <form.Field
                name="newPassword"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="new-password">
                        New password
                      </FieldLabel>
                      <InputPassword
                        id="new-password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>
                        Must be at least 8 characters.
                      </FieldDescription>
                      {isInvalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="confirmPassword"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="confirm-password">
                        Confirm new password
                      </FieldLabel>
                      <InputPassword
                        id="confirm-password"
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
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? <Spinner /> : "Change password"}
                </Button>
                <Link
                  to="/forgot-password"
                  className="text-muted-foreground text-sm underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
