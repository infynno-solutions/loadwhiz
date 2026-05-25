import { Badge } from "@loadwhiz/ui/components/badge";
import type { LoadTestStatusEnum } from "@/api/generated/types.gen";

const STATUS_LABELS: Record<LoadTestStatusEnum, string> = {
  draft: "Draft",
  pending: "Pending",
  running: "Running",
  complete: "Complete",
};

const STATUS_VARIANTS: Record<
  LoadTestStatusEnum,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  pending: "outline",
  running: "default",
  complete: "secondary",
};

export function LoadTestStatusBadge({
  status,
}: {
  status: LoadTestStatusEnum;
}) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
  );
}
