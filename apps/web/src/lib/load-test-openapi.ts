import type {
  FastapiCompatV2BodyLoadTestsCreateFromOpenapi,
  LoadTestTypeEnum,
} from "@/api/generated/types.gen";

export type OpenApiLoadFields = {
  host_id: string;
  duration: number;
  total: number;
  test_type?: LoadTestTypeEnum;
  initial?: number;
  timeout?: number;
  error_threshold?: number;
  name?: string | null;
  notes?: string | null;
  callback_email?: string | null;
  callback?: string | null;
  scheduled_at?: string | null;
  include_operations?: string[] | null;
  exclude_operations?: string[] | null;
};

export function buildOpenApiPreviewBody(hostId: string, specFile: File) {
  return {
    host_id: hostId,
    spec_file: specFile,
  };
}

export function buildOpenApiCreateBody(
  specFile: File,
  fields: OpenApiLoadFields,
): FastapiCompatV2BodyLoadTestsCreateFromOpenapi {
  return {
    host_id: fields.host_id,
    duration: fields.duration,
    total: fields.total,
    spec_file: specFile as unknown as string,
    test_type: fields.test_type,
    initial: fields.initial,
    timeout: fields.timeout,
    error_threshold: fields.error_threshold,
    name: fields.name ?? null,
    notes: fields.notes ?? null,
    callback_email: fields.callback_email ?? null,
    callback: fields.callback ?? null,
    scheduled_at: fields.scheduled_at ?? null,
    include_operations: fields.include_operations
      ? JSON.stringify(fields.include_operations)
      : null,
    exclude_operations: fields.exclude_operations
      ? JSON.stringify(fields.exclude_operations)
      : null,
  };
}
