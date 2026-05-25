import { Button } from "@loadwhiz/ui/components/button";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { authResendVerificationMutation } from "@/api/generated/@tanstack/react-query.gen";
import { getApiErrorMessage } from "@/lib/api-errors";
import { signOut } from "@/lib/auth-api";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const resendVerification = useMutation(authResendVerificationMutation());

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="font-semibold text-xl">Dashboard</h1>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={resendVerification.isPending}
          onClick={async () => {
            try {
              const data = await resendVerification.mutateAsync({});
              toast.success("Verification email sent", {
                description: data?.message,
              });
            } catch (error) {
              toast.error(getApiErrorMessage(error));
            }
          }}
        >
          {resendVerification.isPending ? <Spinner /> : "Resend verification"}
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            await signOut();
            navigate({ to: "/login" });
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
