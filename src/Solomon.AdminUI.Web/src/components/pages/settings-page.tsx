"use client";

import { useState } from "react";
import { postSettings } from "@/lib/api/client";
import { useStatus } from "@/lib/hooks/useStatus";
import { useFormFields } from "@/lib/hooks/useFormFields";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { Check, Power } from "lucide-react";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b border-[var(--bd2)] py-4 last:border-b-0">
      <div className="flex-1">
        <div className="text-[13.5px] font-semibold">{label}</div>
        <div className="mt-0.5 text-xs text-[var(--tx3)]">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="h-6 w-[42px] shrink-0 cursor-pointer rounded-full border-none p-0.5 transition-colors"
        style={{ background: checked ? "var(--acc)" : "rgba(148,163,184,0.25)" }}
      >
        <span
          className="block size-5 rounded-full bg-white shadow-sm transition-transform"
          style={{ transform: checked ? "translateX(18px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { data, loading, error, refresh, setEditing } = useStatus();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [autostart, setAutostart] = useState(true);
  const [debug, setDebug] = useState(false);
  const [reconnect, setReconnect] = useState(true);

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
      <p className="mt-1.5 text-[13.5px] text-[var(--tx2)]">Servis i intervali</p>

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

        <Card className="mt-4 px-5 py-1">
          {/* TODO(backend): autostart must control Windows Service via SCM — do not ship as mock-only */}
          <Toggle
            checked={autostart}
            onChange={setAutostart}
            label="Pokreni servis sa Windows-om"
            description="Automatski start kao Windows servis. (Mock — SCM integracija kasnije)"
          />
          <Toggle
            checked={debug}
            onChange={setDebug}
            label="Detaljni log (debug)"
            description="Beleži dodatne dijagnostičke poruke. (Mock)"
          />
          <Toggle
            checked={reconnect}
            onChange={setReconnect}
            label="Automatski ponovo poveži"
            description="Obnavlja WebSocket vezu pri prekidu. (Mock)"
          />
        </Card>

        <div className="mt-4 flex justify-end gap-2.5">
          <Button type="button" variant="outline" disabled>
            <Power className="size-4" />
            Restartuj servis
          </Button>
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
