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
import type { DashboardTimeseriesPoint } from "@/api/generated/types.gen";
import { RESULT_CHART_HEIGHT_CLASS } from "@/components/load-tests/chart-layout";

const chartConfig = {
  requests: { label: "Requests", color: "var(--chart-1)" },
  avg_response_ms: { label: "Avg response (ms)", color: "var(--chart-2)" },
} satisfies ChartConfig;

type TimeseriesChartProps = {
  points: DashboardTimeseriesPoint[];
};

export function TimeseriesChart({ points }: TimeseriesChartProps) {
  if (points.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No timeseries data yet.</p>
    );
  }

  const data = points.map((p) => ({
    offset: p.offset_sec,
    requests: p.requests ?? 0,
    avg_response_ms: p.avg_response_ms ?? 0,
  }));

  return (
    <ChartContainer config={chartConfig} className={RESULT_CHART_HEIGHT_CLASS}>
      <LineChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="offset"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}s`}
        />
        <YAxis yAxisId="left" tickLine={false} axisLine={false} width={40} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="requests"
          stroke="var(--color-requests)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avg_response_ms"
          stroke="var(--color-avg_response_ms)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
