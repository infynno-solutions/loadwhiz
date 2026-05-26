"use client";

import { Button } from "@loadwhiz/ui/components/button";
import { Input } from "@loadwhiz/ui/components/input";
import { PlusIcon, Trash2Icon } from "lucide-react";

type KeyValueEditorProps = {
  label: string;
  description?: string;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  disabled?: boolean;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
};

function recordToRows(record: Record<string, string>) {
  const entries = Object.entries(record);
  if (entries.length === 0) return [{ key: "", value: "" }];
  return entries.map(([key, value]) => ({ key, value }));
}

function rowsToRecord(rows: { key: string; value: string }[]) {
  const record: Record<string, string> = {};
  for (const row of rows) {
    if (!row.key.trim()) continue;
    record[row.key.trim()] = row.value;
  }
  return record;
}

export function KeyValueEditor({
  label,
  description,
  value,
  onChange,
  disabled,
  keyPlaceholder = "Name",
  valuePlaceholder = "Value",
}: KeyValueEditorProps) {
  const rows = recordToRows(value);

  const updateRows = (nextRows: { key: string; value: string }[]) => {
    onChange(rowsToRecord(nextRows));
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="font-medium text-sm">{label}</p>
        {description ? (
          <p className="text-muted-foreground text-xs">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={row.key}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, key: e.target.value };
                updateRows(next);
              }}
              placeholder={keyPlaceholder}
              disabled={disabled}
              className="flex-1"
            />
            <Input
              value={row.value}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, value: e.target.value };
                updateRows(next);
              }}
              placeholder={valuePlaceholder}
              disabled={disabled}
              className="flex-[2]"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || rows.length <= 1}
              aria-label={`Remove ${label} row`}
              onClick={() => updateRows(rows.filter((_, i) => i !== index))}
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={disabled}
        onClick={() => updateRows([...rows, { key: "", value: "" }])}
      >
        <PlusIcon />
        Add {label.toLowerCase()}
      </Button>
    </div>
  );
}
