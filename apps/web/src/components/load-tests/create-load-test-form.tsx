"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@loadwhiz/ui/components/field";
import { Input } from "@loadwhiz/ui/components/input";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { Textarea } from "@loadwhiz/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
  loadTestsCreateFromOpenapiMutation,
  loadTestsCreateMutation,
  loadTestsImportPreviewMutation,
} from "@/api/generated/@tanstack/react-query.gen";
import type {
  HostResponse,
  OpenApiImportPreview,
} from "@/api/generated/types.gen";
import { LoadTestFormAccordion } from "@/components/load-tests/load-test-form-accordion";
import { LoadTestUrlsEditor } from "@/components/load-tests/load-test-urls-editor";
import { OpenApiPreviewPanel } from "@/components/load-tests/openapi-preview-panel";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  buildOpenApiCreateBody,
  buildOpenApiPreviewBody,
} from "@/lib/load-test-openapi";
import { loadTestsListQueryKeyForOrg } from "@/lib/load-test-queries";
import {
  emptyUrlRow,
  urlRowToHttpRequest,
} from "@/lib/load-test-request-mappers";
import type { UrlRow } from "@/schemas/load-tests";
import {
  type CreateManualLoadTestFormValues,
  type CreateOpenApiFileLoadTestFormValues,
  type CreateOpenApiJsonLoadTestFormValues,
  createManualLoadTestSchema,
  createOpenApiFileLoadTestSchema,
  createOpenApiJsonLoadTestSchema,
  parseOpenApiDocument,
  parseOperationsJson,
} from "@/schemas/load-tests";

const defaultLoadFields = {
  name: "",
  host_id: "",
  test_type: "per-test" as const,
  duration: 60,
  total: 15,
  initial: 0,
  timeout: 30_000,
  error_threshold: 5,
  notes: "",
  callback_email: "",
};

const SOURCE_OPTIONS = [
  {
    id: "manual" as const,
    title: "Manual URLs",
    description:
      "Define each HTTP method and URL yourself. Best for a small, fixed set of endpoints.",
  },
  {
    id: "openapi-file" as const,
    title: "OpenAPI file",
    description:
      "Upload a JSON or YAML spec. We resolve operations against your verified host and preview before creating.",
  },
  {
    id: "openapi-json" as const,
    title: "OpenAPI JSON",
    description:
      "Paste the full OpenAPI document inline when you do not have a file handy.",
  },
];

type CreateLoadTestFormProps = {
  orgId: string;
  verifiedHosts: HostResponse[];
};

export function CreateLoadTestForm({
  orgId,
  verifiedHosts,
}: CreateLoadTestFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [source, setSource] =
    useState<(typeof SOURCE_OPTIONS)[number]["id"]>("manual");
  const [preview, setPreview] = useState<OpenApiImportPreview | null>(null);
  const [specFile, setSpecFile] = useState<File | null>(null);

  const createManual = useMutation(loadTestsCreateMutation());
  const createOpenApiJson = useMutation(loadTestsCreateMutation());
  const createOpenApiFile = useMutation(loadTestsCreateFromOpenapiMutation());
  const previewImport = useMutation(loadTestsImportPreviewMutation());

  const invalidateList = async () => {
    await queryClient.invalidateQueries({
      queryKey: loadTestsListQueryKeyForOrg(orgId),
    });
  };

  const manualForm = useForm({
    defaultValues: {
      ...defaultLoadFields,
      urls: [emptyUrlRow()],
    } satisfies CreateManualLoadTestFormValues,
    validators: { onSubmit: createManualLoadTestSchema },
    onSubmit: async ({ value }) => {
      try {
        const result = await createManual.mutateAsync({
          path: { org_id: orgId },
          body: {
            url_source: "manual",
            host_id: value.host_id,
            test_type: value.test_type,
            duration: value.duration,
            total: value.total,
            initial: value.initial,
            timeout: value.timeout,
            error_threshold: value.error_threshold,
            name: value.name || null,
            notes: value.notes || null,
            callback_email: value.callback_email || null,
            urls: value.urls.map(urlRowToHttpRequest),
          },
        });
        await invalidateList();
        toast.success("Load test created.");
        void navigate({
          to: "/app/tests/$testId",
          params: { testId: result.test_id },
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not create load test."));
      }
    },
  });

  const openApiJsonForm = useForm({
    defaultValues: {
      ...defaultLoadFields,
      openapi_document: "",
      include_operations: "",
      exclude_operations: "",
    } satisfies CreateOpenApiJsonLoadTestFormValues,
    validators: { onSubmit: createOpenApiJsonLoadTestSchema },
    onSubmit: async ({ value }) => {
      try {
        let includeOps: string[] | null = null;
        let excludeOps: string[] | null = null;
        try {
          includeOps = parseOperationsJson(value.include_operations);
          excludeOps = parseOperationsJson(value.exclude_operations);
        } catch {
          toast.error("Include/exclude operations must be valid JSON arrays.");
          return;
        }
        const doc = parseOpenApiDocument(value.openapi_document);
        const result = await createOpenApiJson.mutateAsync({
          path: { org_id: orgId },
          body: {
            url_source: "openapi",
            host_id: value.host_id,
            openapi_document: doc,
            test_type: value.test_type,
            duration: value.duration,
            total: value.total,
            initial: value.initial,
            timeout: value.timeout,
            error_threshold: value.error_threshold,
            name: value.name || null,
            notes: value.notes || null,
            callback_email: value.callback_email || null,
            include_operations: includeOps,
            exclude_operations: excludeOps,
          },
        });
        await invalidateList();
        toast.success("Load test created from OpenAPI.");
        void navigate({
          to: "/app/tests/$testId",
          params: { testId: result.test_id },
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not create load test."));
      }
    },
  });

  const openApiFileForm = useForm({
    defaultValues: {
      ...defaultLoadFields,
      spec_file: undefined as unknown as File,
      include_operations: "",
      exclude_operations: "",
    } satisfies CreateOpenApiFileLoadTestFormValues,
    validators: { onSubmit: createOpenApiFileLoadTestSchema },
    onSubmit: async ({ value }) => {
      const file = specFile ?? value.spec_file;
      if (!(file instanceof File)) {
        toast.error("Select an OpenAPI specification file.");
        return;
      }
      try {
        let includeOps: string[] | null = null;
        let excludeOps: string[] | null = null;
        try {
          includeOps = parseOperationsJson(value.include_operations);
          excludeOps = parseOperationsJson(value.exclude_operations);
        } catch {
          toast.error("Include/exclude operations must be valid JSON arrays.");
          return;
        }
        const result = await createOpenApiFile.mutateAsync({
          path: { org_id: orgId },
          body: buildOpenApiCreateBody(file, {
            host_id: value.host_id,
            duration: value.duration,
            total: value.total,
            test_type: value.test_type,
            initial: value.initial,
            timeout: value.timeout,
            error_threshold: value.error_threshold,
            name: value.name || null,
            notes: value.notes || null,
            callback_email: value.callback_email || null,
            include_operations: includeOps,
            exclude_operations: excludeOps,
          }),
        });
        await invalidateList();
        toast.success("Load test created from OpenAPI file.");
        void navigate({
          to: "/app/tests/$testId",
          params: { testId: result.test_id },
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not create load test."));
      }
    },
  });

  const handlePreview = async () => {
    const hostId = openApiFileForm.getFieldValue("host_id");
    if (!hostId) {
      toast.error("Select a verified host first.");
      return;
    }
    if (!specFile) {
      toast.error("Select an OpenAPI file to preview.");
      return;
    }
    try {
      const data = await previewImport.mutateAsync({
        path: { org_id: orgId },
        body: {
          ...buildOpenApiPreviewBody(hostId, specFile),
          spec_file: specFile as unknown as string,
        },
      });
      setPreview(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not preview import."));
    }
  };

  const isPending =
    createManual.isPending ||
    createOpenApiJson.isPending ||
    createOpenApiFile.isPending;

  const noHosts = verifiedHosts.length === 0;

  const openApiFilters = (form: typeof openApiFileForm) => (
    <>
      <form.Field name="include_operations">
        {(field: {
          state: { value: string | undefined };
          handleChange: (v: string) => void;
        }) => (
          <Field>
            <FieldLabel>Include operations</FieldLabel>
            <FieldDescription>
              Optional JSON array allowlist, e.g.{" "}
              <code className="text-xs">["GET /v1/health"]</code>. Leave empty
              to import all matching operations.
            </FieldDescription>
            <Textarea
              value={field.state.value ?? ""}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder='["GET /v1/health"]'
              rows={2}
              className="font-mono text-xs"
            />
          </Field>
        )}
      </form.Field>
      <form.Field name="exclude_operations">
        {(field: {
          state: { value: string | undefined };
          handleChange: (v: string) => void;
        }) => (
          <Field>
            <FieldLabel>Exclude operations</FieldLabel>
            <FieldDescription>
              Optional JSON array denylist of operation IDs to skip.
            </FieldDescription>
            <Textarea
              value={field.state.value ?? ""}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={2}
              className="font-mono text-xs"
            />
          </Field>
        )}
      </form.Field>
    </>
  );

  return (
    <div className="flex w-full flex-col gap-8">
      {noHosts ? (
        <Card>
          <CardHeader>
            <CardTitle>Verified host required</CardTitle>
            <CardDescription>
              Add and verify a host on the{" "}
              <Link
                to="/app/hosts"
                className="cursor-pointer text-primary underline"
              >
                Hosts
              </Link>{" "}
              page before creating a load test.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-medium text-sm">
              How do you want to define requests?
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {SOURCE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSource(option.id);
                    setPreview(null);
                  }}
                  className={`cursor-pointer rounded-lg border p-4 text-left transition-colors ${
                    source === option.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <p className="font-medium text-sm">{option.title}</p>
                  <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {source === "manual" ? (
            <form
              id="create-manual-test"
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                void manualForm.handleSubmit();
              }}
            >
              <LoadTestFormAccordion
                form={manualForm}
                verifiedHosts={verifiedHosts}
                showInitial={
                  manualForm.getFieldValue("test_type") === "maintain-load"
                }
                requestsSection={
                  <manualForm.Field name="urls">
                    {(field: {
                      state: { value: UrlRow[] };
                      handleChange: (v: UrlRow[]) => void;
                    }) => (
                      <LoadTestUrlsEditor
                        urls={field.state.value}
                        onChange={field.handleChange}
                      />
                    )}
                  </manualForm.Field>
                }
              />
            </form>
          ) : null}

          {source === "openapi-file" ? (
            <form
              id="create-openapi-file-test"
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                void openApiFileForm.handleSubmit();
              }}
            >
              <LoadTestFormAccordion
                form={openApiFileForm}
                verifiedHosts={verifiedHosts}
                showInitial={
                  openApiFileForm.getFieldValue("test_type") === "maintain-load"
                }
                openapiSection={
                  <>
                    <Field>
                      <FieldLabel>Specification file</FieldLabel>
                      <FieldDescription>
                        OpenAPI 3.0 or 3.1 in JSON or YAML format.
                      </FieldDescription>
                      <Input
                        type="file"
                        accept=".json,.yaml,.yml"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setSpecFile(file);
                          setPreview(null);
                        }}
                      />
                    </Field>
                    {openApiFilters(openApiFileForm)}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      disabled={previewImport.isPending}
                      onClick={() => void handlePreview()}
                    >
                      {previewImport.isPending ? <Spinner /> : null}
                      Preview import
                    </Button>
                    {preview ? <OpenApiPreviewPanel preview={preview} /> : null}
                  </>
                }
              />
            </form>
          ) : null}

          {source === "openapi-json" ? (
            <form
              id="create-openapi-json-test"
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                void openApiJsonForm.handleSubmit();
              }}
            >
              <LoadTestFormAccordion
                form={openApiJsonForm}
                verifiedHosts={verifiedHosts}
                showInitial={
                  openApiJsonForm.getFieldValue("test_type") === "maintain-load"
                }
                openapiSection={
                  <>
                    <openApiJsonForm.Field name="openapi_document">
                      {(field: {
                        name: string;
                        state: {
                          value: string;
                          meta: {
                            isTouched: boolean;
                            isValid: boolean;
                            errors: unknown[];
                          };
                        };
                        handleBlur: () => void;
                        handleChange: (v: string) => void;
                      }) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>
                              OpenAPI document
                            </FieldLabel>
                            <FieldDescription>
                              Paste the full JSON object from your spec.
                            </FieldDescription>
                            <Textarea
                              id={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              rows={10}
                              className="font-mono text-xs"
                              placeholder='{"openapi":"3.0.0",...}'
                            />
                            {isInvalid ? (
                              <FieldError errors={field.state.meta.errors} />
                            ) : null}
                          </Field>
                        );
                      }}
                    </openApiJsonForm.Field>
                    {openApiFilters(openApiJsonForm)}
                  </>
                }
              />
            </form>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              render={<Link to="/app/tests" />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              form={
                source === "manual"
                  ? "create-manual-test"
                  : source === "openapi-file"
                    ? "create-openapi-file-test"
                    : "create-openapi-json-test"
              }
            >
              {isPending ? <Spinner /> : null}
              Create load test
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
