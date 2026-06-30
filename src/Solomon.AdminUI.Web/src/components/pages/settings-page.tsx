"use client";

import { useState } from "react";
import { postSettings } from "@/lib/api/client";
import { useStatus } from "@/lib/hooks/useStatus";
import { useFormFields } from "@/lib/hooks/useFormFields";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { Check } from "lucide-react";

export function SettingsPage() {
  const { data, loading, error, refresh, setEditing } = useStatus();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const source = data
    ? {
        adminPort: data.adminPort ?? 5050,
        heartbeatIntervalSeconds: data.heartbeatIntervalSeconds ?? 7,
      }
    : null;

  const { fields, updateField, markSaved } = useFormFields(source);

  if (loading && !data) {
    return <Centered>Učitavanje…</Centered>;
  }

  if (error || !data || !fields) {
    return <Centered>{error ?? "Status nije dostupan."}</Centered>;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const result = await postSettings({
        adminPort: Number(fields!.adminPort),
        heartbeatIntervalSeconds: Number(fields!.heartbeatIntervalSeconds),
      });
      setMessage({ text: result.message, ok: true });
      markSaved();
      setEditing(false);
      await refresh();
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
    <div className="animate-fade-up px-7 py-[26px] pb-12">
      <h1 className="m-0 text-2xl font-bold tracking-tight">Podešavanja</h1>
      <p className="mt-1.5 text-[13.5px] text-[var(--tx2)]">Admin port i heartbeat interval.</p>

      <form onSubmit={(e) => void handleSave(e)} className="mt-6 max-w-2xl">
        <Card className="p-5">
          <div className="text-sm font-semibold">Parametri servisa</div>
          <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <Label>Admin port (127.0.0.1)</Label>
              <Input
                className="font-mono"
                type="number"
                min={1024}
                max={65535}
                value={fields.adminPort}
                onChange={(e) => {
                  setEditing(true);
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
                  setEditing(true);
                  updateField("heartbeatIntervalSeconds", Number(e.target.value));
                }}
              />
            </div>
          </div>
        </Card>

        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={saving}>
            <Check className="size-4" />
            {saving ? "Čuvanje…" : "Sačuvaj"}
          </Button>
        </div>
        <FormMessage text={message?.text ?? null} ok={message?.ok} />
      </form>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-64 items-center justify-center text-[var(--tx2)]">{children}</div>
  );
}
