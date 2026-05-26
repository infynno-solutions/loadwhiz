"use client";

import { Button } from "@loadwhiz/ui/components/button";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import { loadTestsUpdateMutation } from "@/api/generated/@tanstack/react-query.gen";
import type { HostResponse, LoadTestResponse } from "@/api/generated/types.gen";
import { LoadTestConfigAccordion } from "@/components/load-tests/load-test-config-accordion";
import { LoadTestFormAccordion } from "@/components/load-tests/load-test-form-accordion";
import { LoadTestUrlsEditor } from "@/components/load-tests/load-test-urls-editor";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  loadTestsGetQueryKeyFor,
  loadTestsListQueryKeyForOrg,
} from "@/lib/load-test-queries";
import {
  httpRequestToUrlRow,
  urlRowToHttpRequest,
} from "@/lib/load-test-request-mappers";
import type { UrlRow } from "@/schemas/load-tests";
import {
  type UpdateLoadTestFormValues,
  updateLoadTestSchema,
} from "@/schemas/load-tests";

type LoadTestConfigFormProps = {
  orgId: string;
  test: LoadTestResponse;
  verifiedHosts: HostResponse[];
  hostLabel?: string;
  readOnly?: boolean;
};

export function LoadTestConfigForm({
  orgId,
  test,
  verifiedHosts,
  hostLabel,
  readOnly,
}: LoadTestConfigFormProps) {
  const queryClient = useQueryClient();
  const updateTest = useMutation(loadTestsUpdateMutation());

  const form = useForm({
    defaultValues: {
      name: test.name ?? "",
      test_type: test.test_type,
      duration: test.duration,
      total: test.total,
      initial: test.initial,
      timeout: test.timeout,
      error_threshold: test.error_threshold,
      notes: test.notes ?? "",
      callback_email: test.callback_email ?? "",
      urls: test.urls.map(httpRequestToUrlRow),
    } satisfies UpdateLoadTestFormValues,
    validators: { onSubmit: updateLoadTestSchema },
    onSubmit: async ({ value }) => {
      try {
        await updateTest.mutateAsync({
          path: { org_id: orgId, test_id: test.test_id },
          body: {
            name: value.name || null,
            test_type: value.test_type,
            duration: value.duration,
            total: value.total,
            initial: value.initial,
            timeout: value.timeout,
            error_threshold: value.error_threshold,
            notes: value.notes || null,
            callback_email: value.callback_email || null,
            urls: value.urls?.map(urlRowToHttpRequest),
          },
        });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: loadTestsListQueryKeyForOrg(orgId),
          }),
          queryClient.invalidateQueries({
            queryKey: loadTestsGetQueryKeyFor(orgId, test.test_id),
          }),
        ]);
        toast.success("Configuration saved.");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not update load test."));
      }
    },
  });

  useEffect(() => {
    form.reset({
      name: test.name ?? "",
      test_type: test.test_type,
      duration: test.duration,
      total: test.total,
      initial: test.initial,
      timeout: test.timeout,
      error_threshold: test.error_threshold,
      notes: test.notes ?? "",
      callback_email: test.callback_email ?? "",
      urls: test.urls.map(httpRequestToUrlRow),
    });
  }, [form, test]);

  if (readOnly) {
    return <LoadTestConfigAccordion test={test} hostLabel={hostLabel} />;
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <LoadTestFormAccordion
        form={form}
        verifiedHosts={verifiedHosts}
        hideHost
        showInitial={form.getFieldValue("test_type") === "maintain-load"}
        requestsSection={
          <form.Field name="urls">
            {(field: {
              state: { value: UrlRow[] | undefined };
              handleChange: (v: UrlRow[]) => void;
            }) => (
              <LoadTestUrlsEditor
                urls={field.state.value ?? []}
                onChange={field.handleChange}
              />
            )}
          </form.Field>
        }
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={updateTest.isPending}>
          {updateTest.isPending ? <Spinner /> : null}
          Save changes
        </Button>
      </div>
    </form>
  );
}
