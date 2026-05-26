"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@loadwhiz/ui/components/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { RESULT_CHART_HEIGHT_CLASS } from "@/components/load-tests/chart-layout";
import { mergeTimeseriesForCompare } from "@/lib/compare-runs";
import type { LoadTestResultDashboardResponse } from "@/api/generated/types.gen";

const requestsConfig = {
  a_requests: { label: "Run A requests", color: "var(--chart-1)" },
  b_requests: { label: "Run B requests", color: "var(--chart-2)" },
} satisfies ChartConfig;

const latencyConfig = {
  a_avg_ms: { label: "Run A avg (ms)", color: "var(--chart-1)" },
  b_avg_ms: { label: "Run B avg (ms)", color: "var(--chart-2)" },
} satisfies ChartConfig;

type CompareTimeseriesChartProps = {
  dashboardA: LoadTestResultDashboardResponse;
  dashboardB: LoadTestResultDashboardResponse;
  metric: "requests" | "avg_ms";
};

export function CompareTimeseriesChart({
  dashboardA,
  dashboardB,
  metric,
}: CompareTimeseriesChartProps) {
  const data = mergeTimeseriesForCompare(
    dashboardA.timeseries,
    dashboardB.timeseries,
  );

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No timeseries data.</p>
    );
  }

  const config = metric === "requests" ? requestsConfig : latencyConfig;

  return (
    <ChartContainer config={config} className={RESULT_CHART_HEIGHT_CLASS}>
      <LineChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="offset"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}s`}
        />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {metric === "requests" ? (
          <>
            <Line
              type="monotone"
              dataKey="a_requests"
              stroke="var(--color-a_requests)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="b_requests"
              stroke="var(--color-b_requests)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </>
        ) : (
          <>
            <Line
              type="monotone"
              dataKey="a_avg_ms"
              stroke="var(--color-a_avg_ms)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="b_avg_ms"
              stroke="var(--color-b_avg_ms)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </>
        )}
      </LineChart>
    </ChartContainer>
  );
}
