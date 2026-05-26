export const LANDING_GITHUB_URL =
  "https://github.com/infynno-solutions/loadwhiz";

export const LANDING_API_DOCS_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/reference`;

export const LANDING_NAV = [
  { label: "Use cases", href: "/#use-cases" },
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Roadmap", href: "/#roadmap" },
] as const;

export const LANDING_FOOTER_COLUMNS = [
  {
    title: "Pages",
    links: LANDING_NAV.map((item) => ({
      label: item.label,
      href: item.href,
    })),
  },
  {
    title: "Product",
    links: [
      { label: "GitHub", href: LANDING_GITHUB_URL, external: true },
      { label: "API reference", href: LANDING_API_DOCS_URL, external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
  {
    title: "Register",
    links: [
      { label: "Get started", href: "/signup" },
      { label: "Login", href: "/login" },
    ],
  },
] as const;
