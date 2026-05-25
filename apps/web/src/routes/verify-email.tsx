import { Button } from "@loadwhiz/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { getApiErrorMessage } from "@/lib/api-errors";
import { redirectIfAuthenticated } from "@/lib/auth";
import { verifyEmail } from "@/lib/auth-api";

const verifyEmailSearchSchema = z.object({
  token: z.string().min(1),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: verifyEmailSearchSchema,
  beforeLoad: () => {
    redirectIfAuthenticated();
  },
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
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Verify email</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {status === "loading" ? (
              <Spinner className="size-6" />
            ) : (
              <Button
                asChild
                variant={status === "error" ? "outline" : "default"}
              >
                <Link to="/login">
                  {status === "success" ? "Continue to login" : "Back to login"}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
