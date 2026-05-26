export const LANDING_GITHUB_URL =
  "https://github.com/infynno-solutions/loadwhiz";

export const LANDING_API_DOCS_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/reference`;

export const LANDING_NAV = [
  { label: "Use cases", href: "#use-cases" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Roadmap", href: "#roadmap" },
] as const;
