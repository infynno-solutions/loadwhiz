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
import { Input } from "@loadwhiz/ui/components/input";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { cn } from "@loadwhiz/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authForgotPasswordMutation } from "@/api/generated/@tanstack/react-query.gen";
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link
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
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        name={field.name}
                        type="email"
                        placeholder="m@example.com"
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
                <Button type="submit" disabled={forgotPassword.isPending}>
                  {forgotPassword.isPending ? <Spinner /> : "Send reset link"}
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
