"use client";

import { useState } from "react";
import { postSettings } from "@/lib/api/client";
import type { AgentStatus } from "@/lib/api/types";
import { useFormFields } from "@/lib/hooks/useFormFields";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { Check, RefreshCw } from "lucide-react";

interface ConnectionParamsFormProps {
  status: AgentStatus;
  onSaved: () => void;
  onEditingChange?: (editing: boolean) => void;
  includeInputFolder?: boolean;
}

export function ConnectionParamsForm({
  status,
  onSaved,
  onEditingChange,
  includeInputFolder = true,
}: ConnectionParamsFormProps) {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const source = {
    serverBaseUrl: status.serverBaseUrl ?? "",
    enrollmentPath: status.enrollmentPath ?? "/agent/enroll",
    inputFolderPath: status.inputFolderPath ?? "",
    adminPort: status.adminPort ?? 5050,
    heartbeatIntervalSeconds: status.heartbeatIntervalSeconds ?? 7,
  };

  const { fields, updateField, markSaved } = useFormFields(source);

  if (!fields) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const result = await postSettings({
        serverBaseUrl: String(fields!.serverBaseUrl),
        enrollmentPath: String(fields!.enrollmentPath),
        inputFolderPath: includeInputFolder ? String(fields!.inputFolderPath) : undefined,
        adminPort: Number(fields!.adminPort),
        heartbeatIntervalSeconds: Number(fields!.heartbeatIntervalSeconds),
      });
      setMessage({ text: result.message, ok: true });
      markSaved();
      onEditingChange?.(false);
      onSaved();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Čuvanje nije uspelo.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <div className="flex flex-col gap-4">
        <div>
          <Label>URL cloud aplikacije (API base URL)</Label>
          <Input
            className="font-mono"
            value={fields.serverBaseUrl}
            onChange={(e) => {
              onEditingChange?.(true);
              updateField("serverBaseUrl", e.target.value);
            }}
            placeholder="https://auth-sync.example.com"
            required
          />
        </div>
        <div>
          <Label>Enrollment putanja</Label>
          <Input
            className="font-mono"
            value={fields.enrollmentPath}
            onChange={(e) => {
              onEditingChange?.(true);
              updateField("enrollmentPath", e.target.value);
            }}
            required
          />
        </div>
        {includeInputFolder ? (
          <div>
            <Label>Input folder</Label>
            <Input
              className="font-mono"
              value={fields.inputFolderPath}
              onChange={(e) => {
                onEditingChange?.(true);
                updateField("inputFolderPath", e.target.value);
              }}
              placeholder="C:\Solomon\Input"
            />
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Admin port (127.0.0.1)</Label>
            <Input
              className="font-mono"
              type="number"
              min={1024}
              max={65535}
              value={fields.adminPort}
              onChange={(e) => {
                onEditingChange?.(true);
                updateField("adminPort", Number(e.target.value));
              }}
            />
          </div>
          <div>
            <Label>Heartbeat interval (s)</Label>
            <Input
              className="font-mono"
              type="number"
              min={5}
              max={10}
              value={fields.heartbeatIntervalSeconds}
              onChange={(e) => {
                onEditingChange?.(true);
                updateField("heartbeatIntervalSeconds", Number(e.target.value));
              }}
            />
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <Button type="submit" disabled={saving}>
          <Check className="size-4" />
          {saving ? "Čuvanje…" : "Sačuvaj i poveži"}
        </Button>
        <Button type="button" variant="outline" disabled>
          <RefreshCw className="size-4" />
          Test konekcije
        </Button>
      </div>
      <FormMessage text={message?.text ?? null} ok={message?.ok} />
    </form>
  );
}
