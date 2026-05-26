"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@loadwhiz/ui/components/collapsible";
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
import { Textarea } from "@loadwhiz/ui/components/textarea";
import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { KeyValueEditor } from "@/components/load-tests/key-value-editor";
import { emptyUrlRow } from "@/lib/load-test-request-mappers";
import { HTTP_METHODS, type UrlRow } from "@/schemas/load-tests";

export type { UrlRow };

type LoadTestUrlsEditorProps = {
  urls: UrlRow[];
  onChange: (urls: UrlRow[]) => void;
  disabled?: boolean;
};

const methodItems = HTTP_METHODS.map((m) => ({ value: m, label: m }));

const BODY_METHODS = new Set<UrlRow["request_type"]>(["POST", "PUT", "PATCH"]);

type AuthMode = "none" | "basic" | "bearer";

function getAuthMode(row: UrlRow): AuthMode {
  if (row.credentials?.login?.trim()) return "basic";
  if (row.bearer?.token?.trim()) return "bearer";
  return "none";
}

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
    onChange([...urls, emptyUrlRow()]);
  };

  return (
    <FieldGroup>
      <div className="flex items-center justify-between">
        <FieldLabel>Requests</FieldLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled}
        >
          <PlusIcon />
          Add request
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {urls.map((row, index) => {
          const authMode = getAuthMode(row);
          const showBody = BODY_METHODS.has(row.request_type ?? "GET");

          return (
            <div key={index} className="rounded-lg border bg-muted/20 p-3">
              <div className="flex gap-2">
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
                  className="min-w-0 flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(index)}
                  disabled={disabled || urls.length <= 1}
                  aria-label="Remove request"
                >
                  <Trash2Icon />
                </Button>
              </div>

              {row.auth_hint ? (
                <p className="mt-2 rounded-md border border-amber-600/30 bg-amber-500/10 px-2 py-1.5 text-amber-950 text-xs dark:text-amber-100">
                  {row.auth_hint} Configure authentication below before running.
                </p>
              ) : null}

              <Collapsible defaultOpen={index === 0} className="mt-3">
                <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-muted-foreground text-sm hover:bg-muted/50">
                  <ChevronDownIcon className="size-4 shrink-0 transition-transform group-aria-expanded/collapsible-trigger:rotate-180" />
                  Headers, auth, body, and more
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 flex flex-col gap-4">
                  <KeyValueEditor
                    label="Headers"
                    description="Additional HTTP request headers."
                    value={row.headers ?? {}}
                    onChange={(headers) => updateRow(index, { headers })}
                    disabled={disabled}
                    keyPlaceholder="Header"
                    valuePlaceholder="Value"
                  />
                  <KeyValueEditor
                    label="Query parameters"
                    description="Appended to the request URL."
                    value={row.request_params ?? {}}
                    onChange={(request_params) =>
                      updateRow(index, { request_params })
                    }
                    disabled={disabled}
                    keyPlaceholder="Parameter"
                    valuePlaceholder="Value"
                  />
                  <KeyValueEditor
                    label="Cookies"
                    description="Sent as Cookie header values."
                    value={row.cookies ?? {}}
                    onChange={(cookies) => updateRow(index, { cookies })}
                    disabled={disabled}
                  />

                  <Field>
                    <FieldLabel>Authentication</FieldLabel>
                    <Select
                      value={authMode}
                      onValueChange={(value) => {
                        const mode = value as AuthMode;
                        if (mode === "none") {
                          updateRow(index, {
                            credentials: undefined,
                            bearer: undefined,
                          });
                        } else if (mode === "basic") {
                          updateRow(index, {
                            credentials: {
                              login: row.credentials?.login ?? "",
                              password: row.credentials?.password ?? "",
                            },
                            bearer: undefined,
                          });
                        } else {
                          updateRow(index, {
                            bearer: {
                              token: row.bearer?.token ?? "",
                              prefix: row.bearer?.prefix ?? "Bearer",
                              header_name:
                                row.bearer?.header_name ?? "Authorization",
                            },
                            credentials: undefined,
                          });
                        }
                      }}
                      disabled={disabled}
                      items={[
                        { value: "none", label: "None" },
                        { value: "basic", label: "Basic" },
                        { value: "bearer", label: "Bearer" },
                      ]}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="bearer">Bearer</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  {authMode === "basic" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field>
                        <FieldLabel>Username</FieldLabel>
                        <Input
                          value={row.credentials?.login ?? ""}
                          onChange={(e) =>
                            updateRow(index, {
                              credentials: {
                                login: e.target.value,
                                password: row.credentials?.password ?? "",
                              },
                            })
                          }
                          disabled={disabled}
                          autoComplete="off"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Password</FieldLabel>
                        <Input
                          type="password"
                          value={row.credentials?.password ?? ""}
                          onChange={(e) =>
                            updateRow(index, {
                              credentials: {
                                login: row.credentials?.login ?? "",
                                password: e.target.value,
                              },
                            })
                          }
                          disabled={disabled}
                          autoComplete="new-password"
                        />
                      </Field>
                    </div>
                  ) : null}

                  {authMode === "bearer" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field className="sm:col-span-2">
                        <FieldLabel>Token</FieldLabel>
                        <Input
                          value={row.bearer?.token ?? ""}
                          onChange={(e) =>
                            updateRow(index, {
                              bearer: {
                                token: e.target.value,
                                prefix: row.bearer?.prefix ?? "Bearer",
                                header_name:
                                  row.bearer?.header_name ?? "Authorization",
                              },
                            })
                          }
                          disabled={disabled}
                          autoComplete="off"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Scheme prefix</FieldLabel>
                        <Input
                          value={row.bearer?.prefix ?? "Bearer"}
                          onChange={(e) =>
                            updateRow(index, {
                              bearer: {
                                token: row.bearer?.token ?? "",
                                prefix: e.target.value,
                                header_name:
                                  row.bearer?.header_name ?? "Authorization",
                              },
                            })
                          }
                          disabled={disabled}
                          placeholder="Bearer"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Header name</FieldLabel>
                        <Input
                          value={row.bearer?.header_name ?? "Authorization"}
                          onChange={(e) =>
                            updateRow(index, {
                              bearer: {
                                token: row.bearer?.token ?? "",
                                prefix: row.bearer?.prefix ?? "Bearer",
                                header_name: e.target.value,
                              },
                            })
                          }
                          disabled={disabled}
                          placeholder="Authorization"
                        />
                      </Field>
                    </div>
                  ) : null}

                  {showBody ? (
                    <Field>
                      <FieldLabel>Request body</FieldLabel>
                      <Textarea
                        value={row.raw_post_body ?? ""}
                        onChange={(e) =>
                          updateRow(index, { raw_post_body: e.target.value })
                        }
                        disabled={disabled}
                        rows={4}
                        placeholder='{"key": "value"}'
                        className="font-mono text-xs"
                      />
                    </Field>
                  ) : null}

                  <Field>
                    <FieldLabel>Payload file URL</FieldLabel>
                    <Input
                      value={row.payload_file_url ?? ""}
                      onChange={(e) =>
                        updateRow(index, { payload_file_url: e.target.value })
                      }
                      disabled={disabled}
                      placeholder="https://storage.example.com/payloads/clients.csv"
                    />
                  </Field>

                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="font-medium text-sm">Response variables</p>
                      <p className="text-muted-foreground text-xs">
                        Capture a response header from this request for use in
                        later steps.
                      </p>
                    </div>
                    {(row.variables ?? []).map((variable, varIndex) => (
                      <div key={varIndex} className="flex gap-2">
                        <Input
                          value={variable.name}
                          onChange={(e) => {
                            const variables = [...(row.variables ?? [])];
                            variables[varIndex] = {
                              ...variable,
                              name: e.target.value,
                            };
                            updateRow(index, { variables });
                          }}
                          placeholder="Variable name"
                          disabled={disabled}
                          className="flex-1"
                        />
                        <Input
                          value={variable.property}
                          onChange={(e) => {
                            const variables = [...(row.variables ?? [])];
                            variables[varIndex] = {
                              ...variable,
                              property: e.target.value,
                            };
                            updateRow(index, { variables });
                          }}
                          placeholder="Response header"
                          disabled={disabled}
                          className="flex-[2]"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={disabled}
                          aria-label="Remove variable"
                          onClick={() =>
                            updateRow(index, {
                              variables: (row.variables ?? []).filter(
                                (_, i) => i !== varIndex,
                              ),
                            })
                          }
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      disabled={disabled}
                      onClick={() =>
                        updateRow(index, {
                          variables: [
                            ...(row.variables ?? []),
                            { name: "", property: "", source: "header" },
                          ],
                        })
                      }
                    >
                      <PlusIcon />
                      Add variable
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}
      </div>
    </FieldGroup>
  );
}
