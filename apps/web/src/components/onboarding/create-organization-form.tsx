import { Button } from "@loadwhiz/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@loadwhiz/ui/components/field";
import { Input } from "@loadwhiz/ui/components/input";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useState } from "react";

import { useCreateOrganization } from "@/lib/use-create-organization";
import { useCurrentUser } from "@/lib/user-queries";

type CreateOrganizationFormProps = {
  onSuccess?: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
};

export function CreateOrganizationForm({
  onSuccess,
  title = "Create your organization",
  description = "An organization is required before you can use LoadWhiz. You will be the owner.",
  submitLabel = "Create organization",
}: CreateOrganizationFormProps) {
  const { data: user } = useCurrentUser();
  const [orgName, setOrgName] = useState("");
  const { createOrganization, isPending } = useCreateOrganization({
    user,
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void createOrganization(orgName);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Inc"
                required
                autoFocus
                disabled={isPending}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Spinner /> : submitLabel}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
