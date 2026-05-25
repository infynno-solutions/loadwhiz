import { z } from "zod";

export const VERIFICATION_METHOD_OPTIONS = [
  { value: "dns", label: "DNS TXT record" },
  { value: "http", label: "HTTP file" },
] as const;

export const createHostSchema = z.object({
  url: z.string().min(1, "Hostname or URL is required."),
  verification_method: z.enum(["dns", "http"], {
    message: "Select a verification method.",
  }),
});

export type CreateHostFormValues = z.infer<typeof createHostSchema>;
