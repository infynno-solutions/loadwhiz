import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const verifyEmailSearchSchema = z.object({
  token: z.string().min(1),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: verifyEmailSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/auth/verify-email",
      search,
      replace: true,
    });
  },
});
