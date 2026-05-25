import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <h1 className="font-semibold text-xl">Terms of Service</h1>
      <p className="mt-2 text-muted-foreground text-sm">Coming soon.</p>
    </div>
  );
}
