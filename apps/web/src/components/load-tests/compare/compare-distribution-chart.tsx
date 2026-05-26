"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@loadwhiz/ui/components/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { RESULT_CHART_HEIGHT_CLASS } from "@/components/load-tests/chart-layout";
import { mergeDistributionForCompare } from "@/lib/compare-runs";
import type { LoadTestResultDashboardResponse } from "@/api/generated/types.gen";

const chartConfig = {
  a_count: { label: "Run A", color: "var(--chart-1)" },
  b_count: { label: "Run B", color: "var(--chart-2)" },
} satisfies ChartConfig;

type CompareDistributionChartProps = {
  dashboardA: LoadTestResultDashboardResponse;
  dashboardB: LoadTestResultDashboardResponse;
};

export function CompareDistributionChart({
  dashboardA,
  dashboardB,
}: CompareDistributionChartProps) {
  const data = mergeDistributionForCompare(
    dashboardA.distribution,
    dashboardB.distribution,
  );

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No distribution data.</p>
    );
  }

  return (
    <ChartContainer config={chartConfig} className={RESULT_CHART_HEIGHT_CLASS}>
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tick={{ fontSize: 10 }}
        />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="a_count"
          fill="var(--color-a_count)"
          radius={4}
        />
        <Bar
          dataKey="b_count"
          fill="var(--color-b_count)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  );
}
