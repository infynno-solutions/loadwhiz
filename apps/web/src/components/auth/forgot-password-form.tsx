import { Field, FieldError, FieldLabel } from "@loadwhiz/ui/components/field";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { cn } from "@loadwhiz/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { authForgotPasswordMutation } from "@/api/generated/@tanstack/react-query.gen";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { AuthLegalNotice } from "@/components/auth/auth-legal-notice";
import {
  authFormClass,
  authFormFooterClass,
  authFormFooterLinkClass,
  authLabelClass,
  authPrimaryButtonClass,
} from "@/components/auth/auth-styles";
import { AuthTextInput } from "@/components/auth/auth-text-input";
import { LandingBrandButton } from "@/components/landing/landing-brand-button";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "@/schemas/auth";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const forgotPassword = useMutation(authForgotPasswordMutation());

  const form = useForm({
    defaultValues: {
      email: "",
    } satisfies ForgotPasswordFormValues,
    validators: {
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const data = await forgotPassword.mutateAsync({
          body: { email: value.email },
        });
        toast.success("Check your email", {
          description:
            data?.message ?? "If an account exists, a reset link was sent.",
        });
        navigate({ to: "/login" });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not send reset email."));
      }
    },
  });

  return (
    <div className={cn(className)} {...props}>
      <AuthFormHeader
        title="Reset your password"
        description="Enter your email and we'll send you a reset link."
      />
      <form
        className={authFormClass}
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="email"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="email" className={authLabelClass}>
                  Email
                </FieldLabel>
                <AuthTextInput
                  id="email"
                  name={field.name}
                  type="email"
                  placeholder="you@example.com"
                  required
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
          disabled={forgotPassword.isPending}
          className={authPrimaryButtonClass}
        >
          {forgotPassword.isPending ? <Spinner /> : "Send reset link"}
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
