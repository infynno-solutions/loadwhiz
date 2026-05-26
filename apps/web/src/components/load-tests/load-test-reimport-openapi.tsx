"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@loadwhiz/ui/components/field";
import { Input } from "@loadwhiz/ui/components/input";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { loadTestsUpdateFromOpenapiMutation } from "@/api/generated/@tanstack/react-query.gen";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  loadTestsGetQueryKeyFor,
  loadTestsListQueryKeyForOrg,
} from "@/lib/load-test-queries";

type LoadTestReimportOpenapiProps = {
  orgId: string;
  testId: string;
};

export function LoadTestReimportOpenapi({
  orgId,
  testId,
}: LoadTestReimportOpenapiProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [specFile, setSpecFile] = useState<File | null>(null);
  const reimport = useMutation(loadTestsUpdateFromOpenapiMutation());

  const handleReimport = async () => {
    const file = specFile ?? inputRef.current?.files?.[0];
    if (!(file instanceof File)) {
      toast.error("Select an OpenAPI specification file.");
      return;
    }
    try {
      await reimport.mutateAsync({
        path: { org_id: orgId, test_id: testId },
        body: { spec_file: file as unknown as string },
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: loadTestsListQueryKeyForOrg(orgId),
        }),
        queryClient.invalidateQueries({
          queryKey: loadTestsGetQueryKeyFor(orgId, testId),
        }),
      ]);
      toast.success("URLs re-imported from OpenAPI.");
      setSpecFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not re-import OpenAPI."));
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <p className="font-medium text-sm">Re-import from OpenAPI</p>
        <p className="text-muted-foreground text-sm">
          Replace request URLs from an updated specification file. Only
          available while this test is a draft.
        </p>
      </div>
      <Field>
        <FieldLabel htmlFor="reimport-spec">Specification file</FieldLabel>
        <FieldDescription>JSON or YAML OpenAPI document.</FieldDescription>
        <Input
          id="reimport-spec"
          ref={inputRef}
          type="file"
          accept=".json,.yaml,.yml,application/json"
          onChange={(e) => setSpecFile(e.target.files?.[0] ?? null)}
        />
      </Field>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-fit"
        disabled={reimport.isPending}
        onClick={() => void handleReimport()}
      >
        {reimport.isPending ? <Spinner /> : null}
        Re-import URLs
      </Button>
    </div>
  );
}
