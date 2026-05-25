"use client";

import { Button } from "@loadwhiz/ui/components/button";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { MailWarningIcon } from "lucide-react";

import { useResendVerificationEmail } from "@/hooks/use-resend-verification-email";
import { useCurrentUser } from "@/lib/user-queries";

export function EmailVerificationBanner() {
  const { data: user, isPending } = useCurrentUser();
  const { resend, isPending: isResending } = useResendVerificationEmail();

  if (isPending || !user || user.is_email_verified) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 border-b bg-amber-500/10 px-4 py-2.5 text-sm"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <MailWarningIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
        <p className="text-foreground">
          <span className="font-medium">Verify your email</span> to unlock all
          features. We sent a link to{" "}
          <span className="font-medium">{user.email}</span>. Check your inbox
          and spam folder.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 border-amber-600/30 bg-background hover:bg-amber-500/10 dark:border-amber-500/30"
        disabled={isResending}
        onClick={() => void resend()}
      >
        {isResending ? <Spinner /> : "Resend verification email"}
      </Button>
    </div>
  );
}
