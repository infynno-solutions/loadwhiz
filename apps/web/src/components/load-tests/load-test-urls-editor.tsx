"use client";

import { Button } from "@loadwhiz/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@loadwhiz/ui/components/field";
import { Input } from "@loadwhiz/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loadwhiz/ui/components/select";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { HTTP_METHODS } from "@/schemas/load-tests";

export type UrlRow = {
  url: string;
  request_type?: (typeof HTTP_METHODS)[number];
};

type LoadTestUrlsEditorProps = {
  urls: UrlRow[];
  onChange: (urls: UrlRow[]) => void;
  disabled?: boolean;
};

const methodItems = HTTP_METHODS.map((m) => ({ value: m, label: m }));

export function LoadTestUrlsEditor({
  urls,
  onChange,
  disabled,
}: LoadTestUrlsEditorProps) {
  const updateRow = (index: number, patch: Partial<UrlRow>) => {
    onChange(urls.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    if (urls.length <= 1) return;
    onChange(urls.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...urls, { url: "", request_type: "GET" }]);
  };

  return (
    <FieldGroup>
      <div className="flex items-center justify-between">
        <FieldLabel>Request URLs</FieldLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled}
        >
          <PlusIcon />
          Add URL
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {urls.map((row, index) => (
          <div key={index} className="flex gap-2">
            <Select
              value={row.request_type ?? "GET"}
              onValueChange={(value) =>
                updateRow(index, {
                  request_type: value as UrlRow["request_type"],
                })
              }
              disabled={disabled}
              items={methodItems}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {methodItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              value={row.url}
              onChange={(e) => updateRow(index, { url: e.target.value })}
              placeholder="https://api.example.com/v1/resource"
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(index)}
              disabled={disabled || urls.length <= 1}
              aria-label="Remove URL"
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
      </div>
    </FieldGroup>
  );
}
