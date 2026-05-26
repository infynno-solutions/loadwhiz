import { Spinner } from "@loadwhiz/ui/components/spinner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { AuthPageShell } from "@/components/auth/auth-page-layout";
import { authPrimaryButtonClass } from "@/components/auth/auth-styles";
import { LandingBrandButton } from "@/components/landing/landing-brand-button";
import { getApiErrorMessage } from "@/lib/api-errors";
import { verifyEmail } from "@/lib/auth-api";

const verifyEmailSearchSchema = z.object({
  token: z.string().min(1),
});

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: verifyEmailSearchSchema,
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState<string>("Verifying your email…");

  useEffect(() => {
    let cancelled = false;

    verifyEmail(token)
      .then((data) => {
        if (cancelled) return;
        const text = data?.message ?? "Email verified successfully.";
        setMessage(text);
        setStatus("success");
        toast.success("Email verified", { description: text });
      })
      .catch((error) => {
        if (cancelled) return;
        const text = getApiErrorMessage(
          error,
          "Verification link is invalid or expired.",
        );
        setMessage(text);
        setStatus("error");
        toast.error(text);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthPageShell>
      <AuthFormHeader title="Verify email" description={message} />
      <div className="flex justify-center py-2">
        {status === "loading" ? (
          <Spinner className="size-6" />
        ) : (
          <LandingBrandButton
            className={authPrimaryButtonClass}
            render={<Link to="/login" />}
          >
            {status === "success" ? "Continue to sign in" : "Back to sign in"}
          </LandingBrandButton>
        )}
      </div>
    </AuthPageShell>
  );
}
