import { Button } from "@loadwhiz/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@loadwhiz/ui/components/empty";
import { Link } from "@tanstack/react-router";

export function NoActiveOrganization() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>No active organization</EmptyTitle>
        <EmptyDescription>
          Select or create an organization to manage organization settings.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link to="/app/onboarding" />}>
          Set up organization
        </Button>
      </EmptyContent>
    </Empty>
  );
}
