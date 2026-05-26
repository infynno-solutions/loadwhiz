"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import { cn } from "@loadwhiz/ui/lib/utils";
import {
  ActivityIcon,
  CalendarIcon,
  FlaskConicalIcon,
  PencilIcon,
  ServerIcon,
  XCircleIcon,
} from "lucide-react";
import type { OrgDashboardStats } from "@/api/generated/types.gen";

type Accent = "blue" | "red" | "green" | "amber" | "violet" | "slate";

type StatCard = {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: Accent;
  badge?: React.ReactNode;
};

function buildCards(stats: OrgDashboardStats): StatCard[] {
  const hostsVerifiedPct =
    stats.hosts_total > 0
      ? Math.round((stats.hosts_verified / stats.hosts_total) * 100)
      : 0;

  return [
    {
      label: "Load tests",
      value: stats.total_tests,
      icon: <FlaskConicalIcon className="size-5" />,
      accent: "violet",
    },
    {
      label: "Active runs",
      value: stats.active_runs,
      icon: <ActivityIcon className="size-5" />,
      accent: "blue",
      badge:
        stats.active_runs > 0 ? (
          <Badge variant="info" className="gap-1">
            <span className="size-1.5 animate-pulse rounded-full bg-sky-500" />
            Live
          </Badge>
        ) : undefined,
    },
    {
      label: "Hosts",
      value: stats.hosts_total,
      icon: <ServerIcon className="size-5" />,
      sub:
        stats.hosts_total > 0
          ? `${stats.hosts_verified} verified · ${hostsVerifiedPct}%`
          : "No hosts registered",
      accent:
        stats.hosts_total === 0 || stats.hosts_verified === 0
          ? "amber"
          : "green",
    },
    {
      label: "Failed last run",
      value: stats.failed_last_run,
      icon: <XCircleIcon className="size-5" />,
      accent: stats.failed_last_run > 0 ? "red" : "slate",
    },
    {
      label: "Drafts",
      value: stats.draft_tests,
      icon: <PencilIcon className="size-5" />,
      accent: "slate",
    },
    {
      label: "Runs (7 days)",
      value: stats.runs_last_7_days,
      icon: <CalendarIcon className="size-5" />,
      accent: "slate",
    },
  ];
}

// Solid-colored icon backgrounds with white icons
const ICON_BG: Record<Accent, string> = {
  blue: "bg-sky-500 text-white",
  red: "bg-red-500 text-white",
  green: "bg-emerald-500 text-white",
  amber: "bg-amber-400 text-white",
  violet: "bg-violet-500 text-white",
  slate: "bg-slate-400 text-white dark:bg-slate-500",
};

type DashboardStatCardsProps = {
  stats: OrgDashboardStats;
};

export function DashboardStatCards({ stats }: DashboardStatCardsProps) {
  const cards = buildCards(stats);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
        >
          {/* Colored icon */}
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl shadow-sm",
              ICON_BG[card.accent],
            )}
          >
            {card.icon}
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {card.label}
            </p>
            <p className="font-bold text-2xl text-foreground tabular-nums leading-tight">
              {card.value}
            </p>
            {card.sub ? (
              <p className="mt-0.5 text-muted-foreground/70 text-xs">
                {card.sub}
              </p>
            ) : null}
          </div>

          {/* Optional badge (top-right) */}
          {card.badge ? (
            <div className="shrink-0 self-start">{card.badge}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
