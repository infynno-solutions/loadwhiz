import { createFileRoute } from "@tanstack/react-router";
import { AuthPageBrand } from "@/components/auth/auth-page-brand";
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
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <AuthPageBrand />
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
