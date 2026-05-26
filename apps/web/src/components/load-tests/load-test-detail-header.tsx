"use client";

import { Button } from "@loadwhiz/ui/components/button";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlayIcon, SquareIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  loadTestsRunMutation,
  loadTestsStopMutation,
} from "@/api/generated/@tanstack/react-query.gen";
import type { LoadTestResponse } from "@/api/generated/types.gen";
import { LoadTestStatusBadge } from "@/components/load-tests/load-test-status-badge";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  canDeleteLoadTest,
  canRunLoadTest,
  canStopLoadTest,
} from "@/lib/load-test-actions";
import {
  applyRunStartedOptimisticUpdates,
  getLoadTestDisplayName,
  invalidateLoadTestQueries,
} from "@/lib/load-test-queries";

type LoadTestDetailHeaderProps = {
  orgId: string;
  test: LoadTestResponse;
  hostLabel?: string;
  onDelete: () => void;
};

export function LoadTestDetailHeader({
  orgId,
  test,
  hostLabel,
  onDelete,
}: LoadTestDetailHeaderProps) {
  const queryClient = useQueryClient();
  const runTest = useMutation(loadTestsRunMutation());
  const stopTest = useMutation(loadTestsStopMutation());

  const handleRun = async () => {
    try {
      const run = await runTest.mutateAsync({
        path: { org_id: orgId, test_id: test.test_id },
      });
      applyRunStartedOptimisticUpdates(queryClient, orgId, test.test_id, run);
      void invalidateLoadTestQueries(queryClient, orgId, test.test_id);
      toast.success("Load test started.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not start load test."));
    }
  };

  const handleStop = async () => {
    try {
      await stopTest.mutateAsync({
        path: { org_id: orgId, test_id: test.test_id },
      });
      await invalidateLoadTestQueries(queryClient, orgId, test.test_id);
      toast.success("Load test stopped.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not stop load test."));
    }
  };

  const busy = runTest.isPending || stopTest.isPending;

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-semibold text-xl">
            {getLoadTestDisplayName(test)}
          </h1>
          <LoadTestStatusBadge status={test.status} />
        </div>
        <p className="text-muted-foreground text-sm">
          {hostLabel ?? test.host_id} · {test.url_source} source ·{" "}
          {test.urls.length} URL{test.urls.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={!canRunLoadTest(test) || busy}
          onClick={() => void handleRun()}
        >
          {runTest.isPending ? <Spinner /> : <PlayIcon />}
          Run
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!canStopLoadTest(test) || busy}
          onClick={() => void handleStop()}
        >
          {stopTest.isPending ? <Spinner /> : <SquareIcon />}
          Stop
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={!canDeleteLoadTest(test)}
          onClick={onDelete}
        >
          <Trash2Icon />
          Delete
        </Button>
      </div>
    </div>
  );
}
