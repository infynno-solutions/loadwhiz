"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import type { OpenApiImportPreview } from "@/api/generated/types.gen";

type OpenApiPreviewPanelProps = {
  preview: OpenApiImportPreview;
};

export function OpenApiPreviewPanel({ preview }: OpenApiPreviewPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Import preview</CardTitle>
        <CardDescription>
          {preview.hostname} · {preview.spec_info.title ?? "OpenAPI spec"} (
          {preview.summary.matched} of {preview.summary.total_operations}{" "}
          operations)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {preview.operations.length} operations
          </Badge>
          {preview.skipped.length > 0 ? (
            <Badge variant="outline">{preview.skipped.length} skipped</Badge>
          ) : null}
        </div>
        <ul className="max-h-40 list-inside list-disc overflow-y-auto text-muted-foreground">
          {preview.operations.slice(0, 20).map((op) => (
            <li key={op.operation_id}>
              <span className="font-mono text-foreground">
                {op.method} {op.path}
              </span>
              {op.summary ? ` — ${op.summary}` : null}
            </li>
          ))}
          {preview.operations.length > 20 ? (
            <li>…and {preview.operations.length - 20} more</li>
          ) : null}
        </ul>
      </CardContent>
    </Card>
  );
}
