import { Button } from "@loadwhiz/ui/components/button";
import { PlusIcon } from "lucide-react";

type HostsToolbarProps = {
  onAddHost: () => void;
  disabled?: boolean;
};

export function HostsToolbar({ onAddHost, disabled }: HostsToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-xl">Hosts</h1>
        <p className="text-muted-foreground text-sm">
          Register and verify domains used as load test targets for your active
          organization.
        </p>
      </div>
      <Button onClick={onAddHost} disabled={disabled}>
        <PlusIcon data-icon="inline-start" />
        Add host
      </Button>
    </div>
  );
}
