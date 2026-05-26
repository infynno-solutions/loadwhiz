"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loadwhiz/ui/components/select";
import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import type { HostResponse } from "@/api/generated/types.gen";

type LoadTestsToolbarProps = {
  hostFilter: string | null;
  onHostFilterChange: (hostId: string | null) => void;
  verifiedHosts: HostResponse[];
  disabled?: boolean;
};

export function LoadTestsToolbar({
  hostFilter,
  onHostFilterChange,
  verifiedHosts,
  disabled,
}: LoadTestsToolbarProps) {
  const hostItems = [
    { value: "all", label: "All hosts" },
    ...verifiedHosts.map((h) => ({ value: h.id, label: h.hostname })),
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-semibold text-xl">Load tests</h1>
        <p className="text-muted-foreground text-sm">
          Create and run load tests against verified hosts.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={hostFilter ?? "all"}
          onValueChange={(value) =>
            onHostFilterChange(value === "all" ? null : value)
          }
          disabled={disabled}
          items={hostItems}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by host" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {hostItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button disabled={disabled} render={<Link to="/app/tests/new" />}>
          <PlusIcon />
          Create test
        </Button>
      </div>
    </div>
  );
}
