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
import { authRegisterMutation } from "@/api/generated/@tanstack/react-query.gen";
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
import { AuthTextInput } from "@/components/auth/auth-text-input";
import { LandingBrandButton } from "@/components/landing/landing-brand-button";
import { getApiErrorMessage } from "@/lib/api-errors";
import { setSession } from "@/lib/auth-session";
import { type SignupFormValues, signupSchema } from "@/schemas/auth";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const register = useMutation(authRegisterMutation());

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    } satisfies SignupFormValues,
    validators: {
      onSubmit: signupSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const data = await register.mutateAsync({
          body: {
            name: value.name,
            email: value.email,
            password: value.password,
          },
        });
        setSession(data);
        toast.success("Account created", {
          description: `Welcome, ${data.user.name}`,
        });
        navigate({ to: "/app/onboarding" });
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    },
  });

  return (
    <div className={cn(className)} {...props}>
      <AuthFormHeader
        title="Create your account"
        description="Get started with LoadWhiz in a few steps."
      />
      <form
        className={authFormClass}
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="name" className={authLabelClass}>
                  Full name
                </FieldLabel>
                <AuthTextInput
                  id="name"
                  name={field.name}
                  type="text"
                  placeholder="John Doe"
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
        <form.Field
          name="password"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="password" className={authLabelClass}>
                  Password
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
          disabled={register.isPending}
          className={authPrimaryButtonClass}
        >
          {register.isPending ? <Spinner /> : "Create account"}
        </LandingBrandButton>
      </form>
      <p className={authFormFooterClass}>
        Already have an account?{" "}
        <Link to="/login" className={authFormFooterLinkClass}>
          Sign in
        </Link>
      </p>
      <AuthLegalNotice />
    </div>
  );
}
