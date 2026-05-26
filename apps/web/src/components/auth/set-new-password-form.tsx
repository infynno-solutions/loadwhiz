import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@loadwhiz/ui/components/field";
import { InputPassword } from "@loadwhiz/ui/components/input-password";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { cn } from "@loadwhiz/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authResetPasswordMutation } from "@/api/generated/@tanstack/react-query.gen";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { AuthLegalNotice } from "@/components/auth/auth-legal-notice";
import {
  authFieldDescriptionClass,
  authFormClass,
  authFormFooterClass,
  authFormFooterLinkClass,
  authInputGroupClass,
  authLabelClass,
  authPrimaryButtonClass,
} from "@/components/auth/auth-styles";
import { LandingBrandButton } from "@/components/landing/landing-brand-button";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  type SetNewPasswordFormValues,
  setNewPasswordSchema,
} from "@/schemas/auth";

type SetNewPasswordFormProps = React.ComponentProps<"div"> & {
  token: string;
};

export function SetNewPasswordForm({
  token,
  className,
  ...props
}: SetNewPasswordFormProps) {
  const navigate = useNavigate();
  const resetPassword = useMutation(authResetPasswordMutation());

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    } satisfies SetNewPasswordFormValues,
    validators: {
      onSubmit: setNewPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const data = await resetPassword.mutateAsync({
          body: {
            token,
            new_password: value.password,
          },
        });
        toast.success("Password updated", {
          description:
            data?.message ?? "You can sign in with your new password.",
        });
        navigate({ to: "/login" });
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Could not reset password. The link may be invalid or expired.",
          ),
        );
      }
    },
  });

  return (
    <div className={cn(className)} {...props}>
      <AuthFormHeader
        title="Choose a new password"
        description="Enter a new password for your account."
      />
      <form
        className={authFormClass}
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="password"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="password" className={authLabelClass}>
                  New password
                </FieldLabel>
                <InputPassword
                  id="password"
                  name={field.name}
                  placeholder="••••••••"
                  required
                  className={authInputGroupClass}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                <FieldDescription className={authFieldDescriptionClass}>
                  Must be at least 8 characters.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
                <FieldLabel
                  htmlFor="confirm-password"
                  className={authLabelClass}
                >
                  Confirm password
                </FieldLabel>
                <InputPassword
                  id="confirm-password"
                  name={field.name}
                  placeholder="••••••••"
                  required
                  className={authInputGroupClass}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
        <LandingBrandButton
          type="submit"
          disabled={resetPassword.isPending}
          className={authPrimaryButtonClass}
        >
          {resetPassword.isPending ? <Spinner /> : "Reset password"}
        </LandingBrandButton>
      </form>
      <p className={authFormFooterClass}>
        Remember your password?{" "}
        <Link to="/login" className={authFormFooterLinkClass}>
          Back to sign in
        </Link>
      </p>
      <AuthLegalNotice />
    </div>
  );
}
