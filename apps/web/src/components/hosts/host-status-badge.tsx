import { Badge } from "@loadwhiz/ui/components/badge";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "warning" | "success" | "destructive" | "neutral";
  }
> = {
  pending: { label: "Pending", variant: "warning" },
  verified: { label: "Verified", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
};

export function HostStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status,
    variant: "neutral" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
