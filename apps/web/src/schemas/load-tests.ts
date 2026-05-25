import { z } from "zod";

export const LOAD_TEST_TYPE_OPTIONS = [
  { value: "per-second", label: "Per second" },
  { value: "per-test", label: "Per test" },
  { value: "maintain-load", label: "Maintain load" },
] as const;

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const httpRequestSchema = z.object({
  url: z.string().min(1, "URL is required."),
  request_type: z.enum(HTTP_METHODS).optional(),
});

const loadFieldsSchema = z.object({
  name: z.string().optional(),
  host_id: z.string().min(1, "Select a verified host."),
  test_type: z.enum(["per-second", "per-test", "maintain-load"]),
  duration: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 second."),
  total: z.coerce.number().int().min(15, "Total clients must be at least 15."),
  initial: z.coerce.number().int().min(0).optional(),
  timeout: z.coerce.number().int().min(100).optional(),
  error_threshold: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  callback_email: z.union([z.string().email(), z.literal("")]).optional(),
});

export const createManualLoadTestSchema = loadFieldsSchema.extend({
  urls: z.array(httpRequestSchema).min(1, "Add at least one URL."),
});

export const createOpenApiJsonLoadTestSchema = loadFieldsSchema.extend({
  openapi_document: z
    .string()
    .min(2, "Paste an OpenAPI JSON or YAML document."),
  include_operations: z.string().optional(),
  exclude_operations: z.string().optional(),
});

export const createOpenApiFileLoadTestSchema = loadFieldsSchema.extend({
  spec_file: z.custom<File>(
    (v) => v instanceof File,
    "Select an OpenAPI file.",
  ),
  include_operations: z.string().optional(),
  exclude_operations: z.string().optional(),
});

export const updateLoadTestSchema = z.object({
  name: z.string().optional(),
  test_type: z.enum(["per-second", "per-test", "maintain-load"]).optional(),
  duration: z.coerce.number().int().min(1).optional(),
  total: z.coerce.number().int().min(15).optional(),
  initial: z.coerce.number().int().min(0).optional(),
  timeout: z.coerce.number().int().min(100).optional(),
  error_threshold: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  callback_email: z.union([z.string().email(), z.literal("")]).optional(),
  urls: z.array(httpRequestSchema).min(1).optional(),
});

export type CreateManualLoadTestFormValues = z.infer<
  typeof createManualLoadTestSchema
>;
export type CreateOpenApiJsonLoadTestFormValues = z.infer<
  typeof createOpenApiJsonLoadTestSchema
>;
export type CreateOpenApiFileLoadTestFormValues = z.infer<
  typeof createOpenApiFileLoadTestSchema
>;
export type UpdateLoadTestFormValues = z.infer<typeof updateLoadTestSchema>;

export function parseOperationsJson(
  value: string | undefined,
): string[] | null {
  if (!value?.trim()) return null;
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Must be a JSON array of operation strings.");
  }
  return parsed.map(String);
}

export function parseOpenApiDocument(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("OpenAPI document must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}
