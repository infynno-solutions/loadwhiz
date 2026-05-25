import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_API_URL: z.url().default("http://localhost:8000"),
  },
  runtimeEnv: {
    VITE_API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  },
  emptyStringAsUndefined: true,
});
