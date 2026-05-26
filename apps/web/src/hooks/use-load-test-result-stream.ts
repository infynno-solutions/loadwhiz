"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import type {
  LoadTestResultDashboardResponse,
  LoadTestResultSummary,
} from "@/api/generated/types.gen";
import { getAccessToken } from "@/lib/auth-session";
import {
  loadTestsGetQueryKeyFor,
  loadTestsListQueryKeyForOrg,
  loadTestsResultsDashboardQueryKeyFor,
  loadTestsResultsListQueryKeyFor,
} from "@/lib/load-test-queries";

type StreamState = {
  connected: boolean;
  dashboard: LoadTestResultDashboardResponse | undefined;
  result: LoadTestResultSummary | undefined;
};

type SnapshotPayload = {
  dashboard?: LoadTestResultDashboardResponse;
  result?: LoadTestResultSummary;
};

function streamUrl(orgId: string, testId: string, resultId: string) {
  const base = `/api/v1/organizations/${orgId}/tests/${testId}/results/${resultId}/stream`;
  const token = getAccessToken();
  if (!token) return base;
  const params = new URLSearchParams({ access_token: token });
  return `${base}?${params.toString()}`;
}

/**
 * Live updates via SSE. Falls back to polling when the stream is unavailable.
 */
export function useLoadTestResultStream(
  orgId: string | undefined,
  testId: string,
  resultId: string,
  enabled: boolean,
) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<StreamState>({
    connected: false,
    dashboard: undefined,
    result: undefined,
  });
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !orgId || typeof window === "undefined") {
      return;
    }

    const url = streamUrl(orgId, testId, resultId);
    const source = new EventSource(url, { withCredentials: true });
    sourceRef.current = source;

    const applyDashboard = (dashboard: LoadTestResultDashboardResponse) => {
      setState((prev) => ({ ...prev, dashboard }));
      queryClient.setQueryData(
        loadTestsResultsDashboardQueryKeyFor(orgId, testId, resultId),
        dashboard,
      );
    };

    const applyResult = (result: LoadTestResultSummary) => {
      setState((prev) => ({ ...prev, result }));
      queryClient.setQueryData(
        loadTestsResultsListQueryKeyFor(orgId, testId),
        (old: LoadTestResultSummary[] | undefined) => {
          if (!old?.length) return [result];
          const index = old.findIndex((r) => r.result_id === result.result_id);
          if (index === -1) return [result, ...old];
          const next = [...old];
          next[index] = { ...next[index], ...result };
          return next;
        },
      );
    };

    const invalidateAll = () => {
      void queryClient.invalidateQueries({
        queryKey: loadTestsListQueryKeyForOrg(orgId),
      });
      void queryClient.invalidateQueries({
        queryKey: loadTestsGetQueryKeyFor(orgId, testId),
      });
      void queryClient.invalidateQueries({
        queryKey: loadTestsResultsListQueryKeyFor(orgId, testId),
      });
      void queryClient.invalidateQueries({
        queryKey: loadTestsResultsDashboardQueryKeyFor(orgId, testId, resultId),
      });
    };

    source.addEventListener("open", () => {
      setState((prev) => ({ ...prev, connected: true }));
    });

    source.addEventListener("snapshot", (event) => {
      try {
        const payload = JSON.parse(event.data) as SnapshotPayload;
        if (payload.dashboard) applyDashboard(payload.dashboard);
        if (payload.result) applyResult(payload.result);
      } catch {
        /* ignore malformed payloads */
      }
    });

    source.addEventListener("dashboard", (event) => {
      try {
        const payload = JSON.parse(
          event.data,
        ) as LoadTestResultDashboardResponse;
        applyDashboard(payload);
      } catch {
        /* ignore */
      }
    });

    source.addEventListener("metrics", (event) => {
      try {
        const metrics = JSON.parse(
          event.data,
        ) as LoadTestResultSummary["metrics"];
        setState((prev) => {
          if (!prev.result && !prev.dashboard) return prev;
          const nextResult = prev.result
            ? { ...prev.result, metrics }
            : prev.result;
          return { ...prev, result: nextResult };
        });
      } catch {
        /* ignore */
      }
    });

    source.addEventListener("status", (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          status?: LoadTestResultSummary["status"];
          passed?: boolean | null;
        };
        const nextStatus = payload.status;
        if (nextStatus) {
          setState((prev) => {
            const base = prev.result ?? {
              result_id: resultId,
              test_id: testId,
              status: nextStatus,
              created_at: new Date().toISOString(),
            };
            return {
              ...prev,
              result: {
                ...base,
                status: nextStatus,
                passed: payload.passed ?? base.passed,
              },
            };
          });
        }
      } catch {
        /* ignore */
      }
    });

    source.addEventListener("done", () => {
      invalidateAll();
      source.close();
    });

    source.onerror = () => {
      setState((prev) => ({ ...prev, connected: false }));
      source.close();
    };

    return () => {
      source.close();
      sourceRef.current = null;
      setState((prev) => ({ ...prev, connected: false }));
    };
  }, [enabled, orgId, testId, resultId, queryClient]);

  return state;
}
