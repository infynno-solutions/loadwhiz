import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoginForm } from "@/components/auth/login-form";
import { redirectIfAuthenticated } from "@/lib/auth";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: () => {
    redirectIfAuthenticated();
  },
  component: LoginPage,
});

function safeRedirect(path?: string) {
  if (path?.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/app/dashboard";
}

function LoginPage() {
  const { redirect } = Route.useSearch();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <LoginForm redirectTo={safeRedirect(redirect)} />
      </div>
    </div>
  );
}
