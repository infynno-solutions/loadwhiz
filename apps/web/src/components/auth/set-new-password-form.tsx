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
import { cn } from "@loadwhiz/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authResetPasswordMutation } from "@/api/generated/@tanstack/react-query.gen";
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Choose a new password</CardTitle>
          <CardDescription>
            Enter a new password for your account
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
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="password">New Password</FieldLabel>
                      <InputPassword
                        id="password"
                        name={field.name}
                        required
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>
                        Must be at least 8 characters long.
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
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
                        Confirm Password
                      </FieldLabel>
                      <InputPassword
                        id="confirm-password"
                        name={field.name}
                        required
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <Field>
                <Button type="submit" disabled={resetPassword.isPending}>
                  {resetPassword.isPending ? <Spinner /> : "Reset password"}
                </Button>
                <FieldDescription className="text-center">
                  Remember your password? <Link to="/login">Back to login</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link to="/terms">Terms of Service</Link> and{" "}
        <Link to="/privacy">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  );
}
