"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import type { DashboardOverview } from "@/api/generated/types.gen";

type ResultOverviewCardsProps = {
  overview: DashboardOverview;
};

export function ResultOverviewCards({ overview }: ResultOverviewCardsProps) {
  const cards = [
    {
      label: "Avg response",
      value:
        overview.avg_response_ms != null
          ? `${overview.avg_response_ms.toFixed(0)} ms`
          : "—",
    },
    {
      label: "Error rate",
      value:
        overview.error_rate_percent != null
          ? `${overview.error_rate_percent.toFixed(2)}%`
          : "—",
    },
    {
      label: "Total requests",
      value: overview.total_requests?.toLocaleString() ?? "—",
    },
    {
      label: "RPS",
      value: overview.rps != null ? overview.rps.toFixed(2) : "—",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-2xl">{card.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
