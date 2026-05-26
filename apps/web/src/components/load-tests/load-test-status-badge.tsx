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
  "neutral" | "warning" | "info" | "success"
> = {
  draft: "neutral",
  pending: "warning",
  running: "info",
  complete: "success",
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
