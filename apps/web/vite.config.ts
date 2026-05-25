import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const allowedHosts = [
  "localhost",
  "127.0.0.1",
  "lw.onfynno.in",
  ".onfynno.in",
];

export default defineConfig({
  server: {
    port: 3001,
    host: true,
    allowedHosts,
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 3000,
    allowedHosts,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
});
