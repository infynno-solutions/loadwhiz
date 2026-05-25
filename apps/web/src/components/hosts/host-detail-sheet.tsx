"use client";

import { Separator } from "@loadwhiz/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@loadwhiz/ui/components/sheet";
import { Skeleton } from "@loadwhiz/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { hostsGetOptions } from "@/api/generated/@tanstack/react-query.gen";
import { HostStatusBadge } from "@/components/hosts/host-status-badge";
import { formatHostDate } from "@/lib/host-queries";

type HostDetailSheetProps = {
  orgId: string;
  hostId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function InstructionsBlock({
  instructions,
}: {
  instructions: Record<string, unknown>;
}) {
  const entries = Object.entries(instructions);
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No instructions available.
      </p>
    );
  }

  return (
    <dl className="flex flex-col gap-3">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-col gap-1">
          <dt className="font-medium text-xs capitalize">
            {key.replaceAll("_", " ")}
          </dt>
          <dd className="break-all rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs">
            {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function HostDetailSheet({
  orgId,
  hostId,
  open,
  onOpenChange,
}: HostDetailSheetProps) {
  const {
    data: host,
    isPending,
    isError,
  } = useQuery({
    ...hostsGetOptions({
      path: { org_id: orgId, host_id: hostId ?? "" },
    }),
    enabled: open && Boolean(hostId),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isPending ? <Skeleton className="h-6 w-40" /> : host?.hostname}
          </SheetTitle>
          <SheetDescription>
            Host details and verification instructions.
          </SheetDescription>
        </SheetHeader>

        {isPending ? (
          <div className="flex flex-col gap-4 px-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}

        {isError ? (
          <p className="px-4 text-destructive text-sm">
            Could not load host details.
          </p>
        ) : null}

        {host ? (
          <div className="flex flex-col gap-6 px-4 pb-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailRow
                label="Status"
                value={<HostStatusBadge status={host.status} />}
              />
              <DetailRow
                label="Method"
                value={
                  <span className="uppercase">{host.verification_method}</span>
                }
              />
              <DetailRow label="Original input" value={host.original_input} />
              <DetailRow
                label="Verification deadline"
                value={formatHostDate(host.verification_deadline)}
              />
              <DetailRow
                label="Last checked"
                value={formatHostDate(host.last_checked_at)}
              />
              <DetailRow
                label="Verified at"
                value={formatHostDate(host.verified_at)}
              />
              <DetailRow label="Check count" value={String(host.check_count)} />
              <DetailRow
                label="Created"
                value={formatHostDate(host.created_at)}
              />
            </dl>

            {host.last_check_error ? (
              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-xs">
                  Last check error
                </p>
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
                  {host.last_check_error}
                </p>
              </div>
            ) : null}

            <Separator />

            <div className="flex flex-col gap-2">
              <h3 className="font-medium text-sm">Verification instructions</h3>
              <InstructionsBlock instructions={host.instructions} />
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
