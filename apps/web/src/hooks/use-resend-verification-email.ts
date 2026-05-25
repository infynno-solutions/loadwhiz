import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { authResendVerificationMutation } from "@/api/generated/@tanstack/react-query.gen";
import { getApiErrorMessage } from "@/lib/api-errors";

export function useResendVerificationEmail() {
  const mutation = useMutation(authResendVerificationMutation());

  const resend = async () => {
    try {
      const data = await mutation.mutateAsync({});
      toast.success("Verification email sent", {
        description: data?.message,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return { resend, isPending: mutation.isPending };
}
