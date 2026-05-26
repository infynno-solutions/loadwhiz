import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { toast } from "sonner";

import { CreateOrganizationForm } from "@/components/onboarding/create-organization-form";

export const Route = createFileRoute("/app/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <CreateOrganizationForm
        onSuccess={async () => {
          toast.success("Organization created");
          await router.invalidate();
          await navigate({ to: "/app/dashboard", replace: true });
        }}
      />
    </div>
  );
}
