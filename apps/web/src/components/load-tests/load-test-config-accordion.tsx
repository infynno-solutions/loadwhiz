"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@loadwhiz/ui/components/accordion";
import type { LoadTestResponse } from "@/api/generated/types.gen";
import { LoadTestFormSection } from "@/components/load-tests/load-test-form-section";
import { LOAD_TEST_TYPE_OPTIONS } from "@/schemas/load-tests";

type LoadTestConfigAccordionProps = {
  test: LoadTestResponse;
  hostLabel?: string;
};

export function LoadTestConfigAccordion({
  test,
  hostLabel,
}: LoadTestConfigAccordionProps) {
  const testTypeLabel =
    LOAD_TEST_TYPE_OPTIONS.find((o) => o.value === test.test_type)?.label ??
    test.test_type;

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
              Host, load profile, notifications, and request URLs.
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-2 pt-2 pb-1">
            <LoadTestFormSection
              title="General"
              description="Identity, target host, and how URLs were defined."
            >
              <ConfigGrid
                rows={[
                  ["Display name", test.name?.trim() || "—"],
                  ["Target host", hostLabel ?? test.host_id],
                  ["URL source", test.url_source],
                  ["OpenAPI file", test.openapi_spec_filename ?? "—"],
                ]}
              />
            </LoadTestFormSection>

            <LoadTestFormSection
              title="Load profile"
              description="Scheduling, duration, clients, and failure thresholds."
            >
              <ConfigGrid
                rows={[
                  ["Scheduling mode", testTypeLabel],
                  ["Duration", `${test.duration} seconds`],
                  ["Total clients", String(test.total)],
                  ["Initial clients", String(test.initial)],
                  ["Request timeout", `${test.timeout} ms`],
                  ["Error threshold", `${test.error_threshold}%`],
                  [
                    "Scheduled at",
                    test.scheduled_at
                      ? new Date(test.scheduled_at).toLocaleString()
                      : "—",
                  ],
                ]}
              />
            </LoadTestFormSection>

            <LoadTestFormSection
              title="Notifications"
              description="Completion email and internal notes."
            >
              <ConfigGrid
                rows={[
                  ["Completion email", test.callback_email ?? "—"],
                  ["Notes", test.notes ?? "—"],
                ]}
              />
            </LoadTestFormSection>

            <LoadTestFormSection
              title="Request URLs"
              description={`${test.urls.length} endpoint${test.urls.length === 1 ? "" : "s"} in run order.`}
              showSeparator={false}
            >
              <ul className="space-y-2 font-mono text-xs">
                {test.urls.map((u) => (
                  <li
                    key={`${u.request_type}-${u.url}`}
                    className="rounded-md border bg-muted/30 px-3 py-2"
                  >
                    <span className="font-medium font-sans text-muted-foreground">
                      {u.request_type ?? "GET"}
                    </span>{" "}
                    {u.url}
                  </li>
                ))}
              </ul>
            </LoadTestFormSection>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function ConfigGrid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="mt-0.5">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
