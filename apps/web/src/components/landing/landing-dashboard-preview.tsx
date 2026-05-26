"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import { Separator } from "@loadwhiz/ui/components/separator";
import { Skeleton } from "@loadwhiz/ui/components/skeleton";
import { cn } from "@loadwhiz/ui/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { landingEase } from "@/components/landing/landing-motion";
import { RESULT_CHART_HEIGHT_CLASS } from "@/components/load-tests/chart-layout";

type LandingDashboardPreviewProps = {
  variant?: "live" | "complete";
  className?: string;
};

const LIVE_METRICS = [
  { label: "Total requests", value: "12,480" },
  { label: "RPS", value: "208.00" },
  { label: "Error rate", value: "0.42%" },
  { label: "Avg response", value: "124 ms" },
] as const;

const COMPLETE_METRICS = [
  { label: "Total requests", value: "74,200" },
  { label: "RPS", value: "412.30" },
  { label: "Error rate", value: "1.85%" },
  { label: "Avg response", value: "98 ms" },
] as const;

const BAR_HEIGHTS = [
  38, 52, 45, 68, 55, 72, 48, 80, 62, 58, 70, 44, 76, 50, 65, 42, 74, 56, 68,
  48, 82, 60, 54, 71,
];

function LiveBadge() {
  const reduced = useReducedMotion();

  return (
    <Badge variant="success" className="gap-1.5">
      {!reduced ? (
        <motion.span
          className="size-1.5 rounded-full bg-emerald-500"
          animate={{ opacity: [1, 0.35, 1], scale: [1, 1.15, 1] }}
          transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
        />
      ) : (
        <span className="size-1.5 rounded-full bg-emerald-500" />
      )}
      Live
    </Badge>
  );
}

function ChartBars({ animate }: { animate: boolean }) {
  return (
    <div
      className={cn(
        "flex items-end gap-1 rounded-lg border bg-muted/30 p-3",
        RESULT_CHART_HEIGHT_CLASS,
      )}
    >
      {BAR_HEIGHTS.map((height, i) =>
        animate ? (
          <motion.div
            key={`bar-${String(i)}`}
            className="w-full min-w-1 flex-1 rounded-sm bg-linear-to-t from-primary/70 to-chart-2/80"
            initial={{ height: "12%" }}
            animate={{ height: `${height}%` }}
            transition={{
              duration: 0.55,
              delay: 0.04 * i,
              ease: landingEase,
            }}
          />
        ) : (
          <Skeleton
            key={`bar-${String(i)}`}
            className="w-full min-w-1 flex-1 rounded-sm"
            style={{ height: `${height}%` }}
          />
        ),
      )}
    </div>
  );
}

export function LandingDashboardPreview({
  variant = "live",
  className,
}: LandingDashboardPreviewProps) {
  const isLive = variant === "live";
  const metrics = isLive ? LIVE_METRICS : COMPLETE_METRICS;
  const reduced = useReducedMotion();

  return (
    <Card className={cn("ring-1 ring-border", className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Checkout API load test</CardTitle>
          <CardDescription>15 clients · 60 sec · per-test</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isLive ? <LiveBadge /> : <Badge variant="info">Ready</Badge>}
          {!isLive ? <Badge variant="success">Passed</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} size="sm">
              <CardHeader className="pb-2">
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-xl tabular-nums">
                  {metric.value}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm">Requests over time</p>
          <ChartBars animate={isLive && !reduced} />
        </div>
      </CardContent>
    </Card>
  );
}
