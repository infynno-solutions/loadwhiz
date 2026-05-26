"use client";

import { useEffect, useState } from "react";

export type LandingHeaderMode = "top" | "floating";

const TOP_THRESHOLD = 24;

export function useLandingHeaderScroll() {
  const [mode, setMode] = useState<LandingHeaderMode>("top");

  useEffect(() => {
    const onScroll = () => {
      setMode(window.scrollY <= TOP_THRESHOLD ? "top" : "floating");
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return mode;
}
