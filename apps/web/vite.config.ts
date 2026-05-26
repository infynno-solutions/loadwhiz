import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const allowedHosts = ["localhost", "127.0.0.1", "lw.onfynno.in", ".onfynno.in"];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, configDir, "");
  const apiTarget = env.VITE_API_URL || "http://localhost:8000";

  return {
    server: {
      port: 3000,
      host: true,
      allowedHosts,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: true,
      port: Number(process.env.PORT) || 3000,
      allowedHosts,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [tailwindcss(), tanstackStart(), viteReact()],
  };
});
