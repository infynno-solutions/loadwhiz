"use client";

import { useEffect } from "react";

function scrollToHashTarget() {
  const { hash } = window.location;
  if (!hash) return;

  const id = decodeURIComponent(hash.slice(1));
  if (id === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export function LandingHashScroll() {
  useEffect(() => {
    scrollToHashTarget();
    window.addEventListener("hashchange", scrollToHashTarget);
    return () => window.removeEventListener("hashchange", scrollToHashTarget);
  }, []);

  return null;
}
