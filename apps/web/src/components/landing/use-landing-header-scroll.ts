"use client";

import { useEffect, useRef, useState } from "react";

export type LandingHeaderMode = "top" | "floating" | "hidden";

const TOP_THRESHOLD = 24;
const SCROLL_DELTA = 6;

export function useLandingHeaderScroll() {
  const [mode, setMode] = useState<LandingHeaderMode>("top");
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      if (currentY <= TOP_THRESHOLD) {
        setMode("top");
      } else if (delta > SCROLL_DELTA) {
        setMode("hidden");
      } else if (delta < -SCROLL_DELTA) {
        setMode("floating");
      }

      lastScrollY.current = currentY;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return mode;
}
