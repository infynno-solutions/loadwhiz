import { createFileRoute } from "@tanstack/react-router";
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
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}
