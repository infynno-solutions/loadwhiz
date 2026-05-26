import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const resetPasswordSearchSchema = z.object({
  token: z.string().min(1),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/auth/reset-password",
      search,
      replace: true,
    });
  },
});
