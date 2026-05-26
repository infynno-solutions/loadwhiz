import { Toaster } from "@loadwhiz/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { APPLE_TOUCH_ICON_SRC, FAVICON_SRC } from "@/components/app-logo";
import { ThemeProvider } from "@/components/theme-provider";
import appCss from "../index.css?url";

export type RouterAppContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "LoadWhiz",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: FAVICON_SRC,
      },
      {
        rel: "apple-touch-icon",
        href: APPLE_TOUCH_ICON_SRC,
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryClientProvider client={queryClient}>
            <Outlet />
            <Toaster richColors />
            <TanStackRouterDevtools position="bottom-left" />
          </QueryClientProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
