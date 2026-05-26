import { Field, FieldError, FieldLabel } from "@loadwhiz/ui/components/field";
import { InputPassword } from "@loadwhiz/ui/components/input-password";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { cn } from "@loadwhiz/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { authLoginMutation } from "@/api/generated/@tanstack/react-query.gen";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import {
  authFormClass,
  authFormFooterClass,
  authFormFooterLinkClass,
  authInputGroupClass,
  authLabelClass,
  authLinkClass,
  authPrimaryButtonClass,
} from "@/components/auth/auth-styles";
import { AuthTextInput } from "@/components/auth/auth-text-input";
import { LandingBrandButton } from "@/components/landing/landing-brand-button";
import { getApiErrorMessage } from "@/lib/api-errors";
import { setSession } from "@/lib/auth-session";
import { type LoginFormValues, loginSchema } from "@/schemas/auth";

type LoginFormProps = React.ComponentProps<"div"> & {
  redirectTo?: string;
};

export function LoginForm({
  className,
  redirectTo = "/app/dashboard",
  ...props
}: LoginFormProps) {
  const navigate = useNavigate();
  const login = useMutation(authLoginMutation());

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } satisfies LoginFormValues,
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const data = await login.mutateAsync({
          body: {
            email: value.email,
            password: value.password,
          },
        });
        setSession(data);
        toast.success("Logged in", {
          description: `Signed in as ${data.user.email}`,
        });
        navigate({ to: redirectTo });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Invalid email or password."));
      }
    },
  });

  return (
    <div className={cn(className)} {...props}>
      <AuthFormHeader
        title="Sign in to your account"
        description="Welcome back! Please enter your details."
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
        <form.Field
          name="password"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <div className="mb-1.5 flex items-center justify-between">
                  <FieldLabel
                    htmlFor="password"
                    className={cn(authLabelClass, "mb-0")}
                  >
                    Password
                  </FieldLabel>
                  <Link
                    to="/forgot-password"
                    className={cn(authLinkClass, "text-sm")}
                  >
                    Forgot?
                  </Link>
                </div>
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
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
        <LandingBrandButton
          type="submit"
          disabled={login.isPending}
          className={authPrimaryButtonClass}
        >
          {login.isPending ? <Spinner /> : "Sign in"}
        </LandingBrandButton>
      </form>
      <p className={authFormFooterClass}>
        Don&apos;t have an account?{" "}
        <Link to="/signup" className={authFormFooterLinkClass}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
