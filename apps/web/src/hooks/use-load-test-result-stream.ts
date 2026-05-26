"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import type {
  DashboardOverview,
  LoadTestResultDashboardResponse,
  LoadTestResultStatusEnum,
  LoadTestResultSummary,
} from "@/api/generated/types.gen";
import { getAccessToken } from "@/lib/auth-session";
import { isActiveResultStatus } from "@/lib/load-test-actions";
import {
  loadTestsGetQueryKeyFor,
  loadTestsListQueryKeyForOrg,
  loadTestsResultsDashboardQueryKeyFor,
  loadTestsResultsGetQueryKeyFor,
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

type DonePayload = {
  status?: LoadTestResultStatusEnum;
  passed?: boolean | null;
};

function streamUrl(orgId: string, testId: string, resultId: string) {
  const base = `/api/v1/organizations/${orgId}/tests/${testId}/results/${resultId}/stream`;
  const token = getAccessToken();
  if (!token) return base;
  const params = new URLSearchParams({ access_token: token });
  return `${base}?${params.toString()}`;
}

function metricsToOverview(
  metrics: NonNullable<LoadTestResultSummary["metrics"]>,
): DashboardOverview {
  return {
    total_requests: metrics.total_requests ?? 0,
    error_rate_percent: metrics.error_rate_percent ?? 0,
    rps: metrics.rps ?? 0,
    avg_response_ms: metrics.avg_ms ?? null,
  };
}

function mergeDashboardMetrics(
  dashboard: LoadTestResultDashboardResponse,
  metrics: NonNullable<LoadTestResultSummary["metrics"]>,
): LoadTestResultDashboardResponse {
  return {
    ...dashboard,
    overview: {
      ...dashboard.overview,
      ...metricsToOverview(metrics),
    },
  };
}

function markDashboardTerminal(
  dashboard: LoadTestResultDashboardResponse,
  payload: DonePayload,
): LoadTestResultDashboardResponse {
  const status = payload.status ?? dashboard.meta.status;
  return {
    ...dashboard,
    meta: {
      ...dashboard.meta,
      status,
      partial: false,
      passed: payload.passed ?? dashboard.meta.passed,
      can_abort: false,
    },
  };
}

/**
 * Live updates via SSE. HTTP polling remains a fallback while the run is active.
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

    const resultQueryKey = loadTestsResultsGetQueryKeyFor(
      orgId,
      testId,
      resultId,
    );
    const dashboardQueryKey = loadTestsResultsDashboardQueryKeyFor(
      orgId,
      testId,
      resultId,
    );

    const applyDashboard = (dashboard: LoadTestResultDashboardResponse) => {
      setState((prev) => ({ ...prev, dashboard }));
      queryClient.setQueryData(dashboardQueryKey, dashboard);
    };

    const applyResult = (result: LoadTestResultSummary) => {
      setState((prev) => ({ ...prev, result }));
      queryClient.setQueryData(resultQueryKey, result);
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

    const applyMetrics = (metrics: LoadTestResultSummary["metrics"]) => {
      if (!metrics) return;
      setState((prev) => {
        const nextResult: LoadTestResultSummary = prev.result
          ? { ...prev.result, metrics }
          : {
              result_id: resultId,
              test_id: testId,
              status: "running",
              metrics,
              created_at: new Date().toISOString(),
              started_at: null,
              finished_at: null,
              passed: null,
              exit_code: null,
              error_message: null,
            };
        const nextDashboard = prev.dashboard
          ? mergeDashboardMetrics(prev.dashboard, metrics)
          : prev.dashboard;
        if (nextDashboard) {
          queryClient.setQueryData(dashboardQueryKey, nextDashboard);
        }
        return { ...prev, result: nextResult, dashboard: nextDashboard };
      });
    };

    const refetchTerminal = async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: resultQueryKey }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
        queryClient.invalidateQueries({
          queryKey: loadTestsListQueryKeyForOrg(orgId),
        }),
        queryClient.invalidateQueries({
          queryKey: loadTestsGetQueryKeyFor(orgId, testId),
        }),
        queryClient.invalidateQueries({
          queryKey: loadTestsResultsListQueryKeyFor(orgId, testId),
        }),
      ]);
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
        if (!isActiveResultStatus(payload.meta.status)) {
          return;
        }
        const metrics = payload.overview
          ? {
              total_requests: payload.overview.total_requests,
              error_rate_percent: payload.overview.error_rate_percent,
              rps: payload.overview.rps,
              avg_ms: payload.overview.avg_response_ms,
              p95_ms: null,
              duration_seconds: payload.meta.duration_seconds,
            }
          : null;
        if (metrics && (metrics.total_requests ?? 0) > 0) {
          applyMetrics(metrics);
        }
      } catch {
        /* ignore */
      }
    });

    source.addEventListener("metrics", (event) => {
      try {
        const metrics = JSON.parse(
          event.data,
        ) as LoadTestResultSummary["metrics"];
        applyMetrics(metrics);
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
        if (!nextStatus) return;
        setState((prev) => {
          const base = prev.result ?? {
            result_id: resultId,
            test_id: testId,
            status: nextStatus,
            created_at: new Date().toISOString(),
            started_at: null,
            finished_at: null,
            passed: null,
            metrics: null,
            exit_code: null,
            error_message: null,
          };
          const nextResult = {
            ...base,
            status: nextStatus,
            passed: payload.passed ?? base.passed,
          };
          const nextDashboard =
            prev.dashboard != null
              ? {
                  ...prev.dashboard,
                  meta: {
                    ...prev.dashboard.meta,
                    status: nextStatus,
                    passed: payload.passed ?? prev.dashboard.meta.passed,
                  },
                }
              : prev.dashboard;
          return {
            ...prev,
            result: nextResult,
            dashboard: nextDashboard,
          };
        });
      } catch {
        /* ignore */
      }
    });

    source.addEventListener("done", (event) => {
      let payload: DonePayload = {};
      try {
        payload = JSON.parse(event.data) as DonePayload;
      } catch {
        /* ignore */
      }

      setState((prev) => {
        const nextResult =
          prev.result && payload.status
            ? {
                ...prev.result,
                status: payload.status,
                passed: payload.passed ?? prev.result.passed,
              }
            : prev.result;
        const nextDashboard =
          prev.dashboard && payload.status
            ? markDashboardTerminal(prev.dashboard, payload)
            : prev.dashboard;
        if (nextDashboard) {
          queryClient.setQueryData(dashboardQueryKey, nextDashboard);
        }
        if (nextResult) {
          queryClient.setQueryData(resultQueryKey, nextResult);
        }
        return {
          connected: false,
          dashboard: undefined,
          result: undefined,
        };
      });

      source.close();
      void refetchTerminal();
    });

    source.onerror = () => {
      setState((prev) => ({ ...prev, connected: false }));
    };

    return () => {
      source.close();
      sourceRef.current = null;
      setState({
        connected: false,
        dashboard: undefined,
        result: undefined,
      });
    };
  }, [enabled, orgId, testId, resultId, queryClient]);

  return state;
}
