import { createFileRoute } from "@tanstack/react-router";
import { AuthPageShell } from "@/components/auth/auth-page-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { redirectIfAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  beforeLoad: () => {
    redirectIfAuthenticated();
  },
  component: SignupPage,
});

function SignupPage() {
  return (
    <AuthPageShell>
      <SignupForm />
    </AuthPageShell>
  );
}
