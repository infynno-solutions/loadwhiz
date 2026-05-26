"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@loadwhiz/ui/components/accordion";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@loadwhiz/ui/components/field";
import { Input } from "@loadwhiz/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loadwhiz/ui/components/select";
import { Textarea } from "@loadwhiz/ui/components/textarea";
import type { HostResponse } from "@/api/generated/types.gen";
import { LoadTestFormSection } from "@/components/load-tests/load-test-form-section";
import { LOAD_TEST_TYPE_OPTIONS } from "@/schemas/load-tests";

type LoadTestFormAccordionProps = {
  // biome-ignore lint/suspicious/noExplicitAny: shared across tanstack forms
  form: any;
  verifiedHosts: HostResponse[];
  showInitial?: boolean;
  hideHost?: boolean;
  requestsSection?: React.ReactNode;
  openapiSection?: React.ReactNode;
};

export function LoadTestFormAccordion({
  form,
  verifiedHosts,
  showInitial,
  hideHost,
  requestsSection,
  openapiSection,
}: LoadTestFormAccordionProps) {
  const hostItems = verifiedHosts.map((h) => ({
    value: h.id,
    label: h.hostname,
  }));

  const hasRequests = Boolean(requestsSection);
  const hasOpenApi = Boolean(openapiSection);

  return (
    <Accordion
      defaultValue={["configuration"]}
      className="overflow-hidden rounded-lg border"
    >
      <AccordionItem value="configuration">
        <AccordionTrigger>
          <div className="flex flex-col gap-0.5 pr-2 text-left">
            <span>Configuration</span>
            <span className="font-normal text-muted-foreground text-xs leading-snug">
              Host, load settings, notifications
              {hasOpenApi ? ", and OpenAPI import" : ""}
              {hasRequests ? ", and request URLs" : ""}.
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-2 pt-2 pb-1">
            <LoadTestFormSection
              title="General"
              description="Name the test and choose the verified host that receives traffic."
            >
              <FieldGroup>
                <form.Field name="name">
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
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Display name
                        </FieldLabel>
                        <FieldDescription>
                          Optional label shown in the list and on the test
                          detail page.
                        </FieldDescription>
                        <Input
                          id={field.name}
                          value={field.state.value ?? ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="API smoke test"
                        />
                        {isInvalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
                {hideHost ? null : (
                  <form.Field name="host_id">
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
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Target host
                          </FieldLabel>
                          <FieldDescription>
                            Must be verified on the Hosts page. Requests are
                            sent to this domain.
                          </FieldDescription>
                          <Select
                            items={hostItems}
                            value={field.state.value}
                            onValueChange={(value) =>
                              field.handleChange(value ?? "")
                            }
                          >
                            <SelectTrigger
                              id={field.name}
                              aria-invalid={isInvalid}
                            >
                              <SelectValue placeholder="Select host" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {hostItems.map((item) => (
                                  <SelectItem
                                    key={item.value}
                                    value={item.value}
                                  >
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          {isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      );
                    }}
                  </form.Field>
                )}
              </FieldGroup>
            </LoadTestFormSection>

            <LoadTestFormSection
              title="Load profile"
              description="Controls how many virtual clients run, for how long, and when a run fails."
            >
              <FieldGroup>
                <form.Field name="test_type">
                  {(field: {
                    name: string;
                    state: { value: string };
                    handleChange: (v: string) => void;
                  }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Scheduling mode
                      </FieldLabel>
                      <FieldDescription>
                        Per test spreads clients across the duration; per second
                        ramps each second; maintain load repeats the URL
                        sequence.
                      </FieldDescription>
                      <Select
                        items={[...LOAD_TEST_TYPE_OPTIONS]}
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value ?? "per-test")
                        }
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {LOAD_TEST_TYPE_OPTIONS.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <form.Field name="duration">
                    {(field: {
                      name: string;
                      state: {
                        value: number;
                        meta: {
                          isTouched: boolean;
                          isValid: boolean;
                          errors: unknown[];
                        };
                      };
                      handleBlur: () => void;
                      handleChange: (v: number) => void;
                    }) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Duration</FieldLabel>
                          <FieldDescription>
                            How long the run lasts, in seconds.
                          </FieldDescription>
                          <Input
                            id={field.name}
                            type="number"
                            min={1}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value) || 0)
                            }
                          />
                          {isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="total">
                    {(field: {
                      name: string;
                      state: {
                        value: number;
                        meta: {
                          isTouched: boolean;
                          isValid: boolean;
                          errors: unknown[];
                        };
                      };
                      handleBlur: () => void;
                      handleChange: (v: number) => void;
                    }) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Total clients
                          </FieldLabel>
                          <FieldDescription>
                            Virtual users hitting your endpoints (minimum 15).
                          </FieldDescription>
                          <Input
                            id={field.name}
                            type="number"
                            min={15}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value) || 0)
                            }
                          />
                          {isInvalid ? (
                            <FieldError errors={field.state.meta.errors} />
                          ) : null}
                        </Field>
                      );
                    }}
                  </form.Field>
                </div>
                {showInitial ? (
                  <form.Field name="initial">
                    {(field: {
                      name: string;
                      state: { value: number | undefined };
                      handleChange: (v: number) => void;
                    }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Initial clients
                        </FieldLabel>
                        <FieldDescription>
                          Clients active at start; only used for maintain-load
                          mode.
                        </FieldDescription>
                        <Input
                          id={field.name}
                          type="number"
                          min={0}
                          value={field.state.value ?? 0}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value) || 0)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <form.Field name="timeout">
                    {(field: {
                      name: string;
                      state: { value: number | undefined };
                      handleChange: (v: number) => void;
                    }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Request timeout
                        </FieldLabel>
                        <FieldDescription>
                          Per-request limit in milliseconds before counting as a
                          timeout.
                        </FieldDescription>
                        <Input
                          id={field.name}
                          type="number"
                          value={field.state.value ?? 30_000}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value) || 30_000)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="error_threshold">
                    {(field: {
                      name: string;
                      state: { value: number | undefined };
                      handleChange: (v: number) => void;
                    }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Error threshold
                        </FieldLabel>
                        <FieldDescription>
                          Maximum acceptable error rate (0–100%). Exceeding this
                          marks the run as failed.
                        </FieldDescription>
                        <Input
                          id={field.name}
                          type="number"
                          min={0}
                          max={100}
                          value={field.state.value ?? 5}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value) || 0)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                </div>
              </FieldGroup>
            </LoadTestFormSection>

            <LoadTestFormSection
              title="Notifications & scheduling"
              description="Optional callbacks, email, and deferred start time."
            >
              <FieldGroup>
                <form.Field name="callback">
                  {(field: {
                    name: string;
                    state: { value: string | undefined };
                    handleChange: (v: string) => void;
                  }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Completion webhook URL
                      </FieldLabel>
                      <FieldDescription>
                        POST JSON when a run finishes (pass or fail).
                      </FieldDescription>
                      <Input
                        id={field.name}
                        type="url"
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="https://example.com/hooks/loadwhiz"
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="scheduled_at">
                  {(field: {
                    name: string;
                    state: { value: string | undefined };
                    handleChange: (v: string) => void;
                  }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Scheduled start
                      </FieldLabel>
                      <FieldDescription>
                        When set, the next run waits until this time (local
                        timezone). Leave empty to run immediately.
                      </FieldDescription>
                      <Input
                        id={field.name}
                        type="datetime-local"
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="callback_email">
                  {(field: {
                    name: string;
                    state: { value: string | undefined };
                    handleChange: (v: string) => void;
                  }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Completion email
                      </FieldLabel>
                      <FieldDescription>
                        Notified when a run finishes (pass or fail).
                      </FieldDescription>
                      <Input
                        id={field.name}
                        type="email"
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="notes">
                  {(field: {
                    name: string;
                    state: { value: string | undefined };
                    handleChange: (v: string) => void;
                  }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Notes</FieldLabel>
                      <FieldDescription>
                        Internal context for teammates; not sent to the target
                        host.
                      </FieldDescription>
                      <Textarea
                        id={field.name}
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        rows={3}
                      />
                    </Field>
                  )}
                </form.Field>
              </FieldGroup>
            </LoadTestFormSection>

            {openapiSection ? (
              <LoadTestFormSection
                title="OpenAPI import"
                description="Specification file or document used to build the request list."
                showSeparator={hasRequests}
              >
                {openapiSection}
              </LoadTestFormSection>
            ) : null}

            {requestsSection ? (
              <LoadTestFormSection
                title="Request URLs"
                description="HTTP methods and URLs executed in order during the run."
                showSeparator={false}
              >
                {requestsSection}
              </LoadTestFormSection>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
