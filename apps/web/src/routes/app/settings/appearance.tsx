import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

import { AppearanceForm } from "@/components/settings/appearance-form";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";

export const Route = createFileRoute("/app/settings/appearance")({
  staticData: {
    breadcrumb: "Appearance",
  },
  component: AppearanceSettingsPage,
});

function AppearanceSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <SettingsPageHeader
        title="Appearance"
        description="Customize how LoadWhiz looks on your device."
      />
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Select a theme preference. System follows your operating system
            setting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceForm />
        </CardContent>
      </Card>
    </div>
  );
}
