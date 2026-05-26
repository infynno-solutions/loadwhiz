import { createFileRoute } from "@tanstack/react-router";

import { MemberAccessBanner } from "@/components/settings/member-access-banner";
import { NoActiveOrganization } from "@/components/settings/no-active-organization";
import { OrganizationGeneralForm } from "@/components/settings/organization-general-form";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { useActiveOrgId } from "@/hooks/use-active-org-id";

export const Route = createFileRoute("/app/settings/organization/")({
  staticData: {
    breadcrumb: "Organization",
  },
  component: OrganizationGeneralPage,
});

function OrganizationGeneralPage() {
  const { orgId, isPending } = useActiveOrgId();

  if (isPending) {
    return null;
  }

  if (!orgId) {
    return (
      <div className="flex flex-col gap-6">
        <SettingsPageHeader
          title="Organization"
          description="Manage your active organization workspace."
        />
        <NoActiveOrganization />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsPageHeader
        title="Organization"
        description="Manage your active organization workspace."
      />
      <MemberAccessBanner />
      <OrganizationGeneralForm orgId={orgId} />
    </div>
  );
}
