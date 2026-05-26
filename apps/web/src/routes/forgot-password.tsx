import { createFileRoute } from "@tanstack/react-router";
import { AuthPageShell } from "@/components/auth/auth-page-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { redirectIfAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/forgot-password")({
  beforeLoad: () => {
    redirectIfAuthenticated();
  },
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
