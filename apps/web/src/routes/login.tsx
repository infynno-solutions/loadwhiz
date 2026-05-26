import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthPageShell } from "@/components/auth/auth-page-layout";
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
    <AuthPageShell>
      <LoginForm redirectTo={safeRedirect(redirect)} />
    </AuthPageShell>
  );
}
