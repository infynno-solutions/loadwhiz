import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthPageShell } from "@/components/auth/auth-page-layout";
import { SetNewPasswordForm } from "@/components/auth/set-new-password-form";
import { redirectIfAuthenticated } from "@/lib/auth";

const resetPasswordSearchSchema = z.object({
  token: z.string().min(1),
});

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  beforeLoad: () => {
    redirectIfAuthenticated();
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();

  return (
    <AuthPageShell>
      <SetNewPasswordForm token={token} />
    </AuthPageShell>
  );
}
