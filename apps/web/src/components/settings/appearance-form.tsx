"use client";

import { cn } from "@loadwhiz/ui/lib/utils";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const themes = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {themes.map((item) => (
          <div
            key={item.value}
            className="h-24 animate-pulse rounded-lg border bg-muted"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {themes.map((item) => {
        const isActive = theme === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => setTheme(item.value)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border p-6 transition-colors",
              isActive
                ? "border-primary bg-primary/5 ring-2 ring-primary"
                : "border-border hover:bg-muted/60",
            )}
          >
            <item.icon className="size-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
