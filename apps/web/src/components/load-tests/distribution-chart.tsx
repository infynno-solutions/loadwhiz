"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@loadwhiz/ui/components/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { DashboardDistributionBucket } from "@/api/generated/types.gen";

const chartConfig = {
  count: { label: "Requests", color: "var(--chart-3)" },
} satisfies ChartConfig;

type DistributionChartProps = {
  buckets: DashboardDistributionBucket[];
};

export function DistributionChart({ buckets }: DistributionChartProps) {
  if (buckets.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No distribution data yet.</p>
    );
  }

  const data = buckets.map((b) => ({
    label: `${b.bucket_start_ms}–${b.bucket_end_ms}ms`,
    count: b.count,
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
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
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
