import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
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
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <SetNewPasswordForm token={token} />
      </div>
    </div>
  );
}
