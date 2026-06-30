"use client";

import { useState } from "react";
import { postSettings } from "@/lib/api/client";
import type { AgentStatus } from "@/lib/api/types";
import { useFormFields } from "@/lib/hooks/useFormFields";
import {
  defaultFilePrefix,
  isDefaultFilePrefix,
  PAYMENT_TRAFFIC_LABELS,
  type PaymentTraffic,
} from "@/lib/file-prefix";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { Check } from "lucide-react";

interface TemplatePrepFormProps {
  status: AgentStatus;
  onSaved: () => void;
}

export function TemplatePrepForm({ status, onSaved }: TemplatePrepFormProps) {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const paymentTraffic = (status.paymentTraffic ?? "domestic") as PaymentTraffic;
  const source = {
    paymentTraffic,
    filePrefix: status.filePrefix ?? defaultFilePrefix(paymentTraffic),
  };

  const { fields, updateField, markSaved } = useFormFields(source);

  if (!fields) return null;

  function handleTrafficChange(next: PaymentTraffic) {
    const currentPrefix = String(fields!.filePrefix);
    const currentTraffic = fields!.paymentTraffic as PaymentTraffic;
    updateField("paymentTraffic", next);
    if (isDefaultFilePrefix(currentTraffic, currentPrefix)) {
      updateField("filePrefix", defaultFilePrefix(next));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const result = await postSettings({
        paymentTraffic: String(fields!.paymentTraffic),
        filePrefix: String(fields!.filePrefix),
      });
      setMessage({ text: result.message, ok: true });
      markSaved();
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
    <Card className="p-5">
      <div className="text-sm font-semibold">Priprema šablona</div>
      <p className="mt-1 text-[13px] text-[var(--tx2)]">
        Prefiks za preuzete i poslate datoteke u Hal E-Bank folderu.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Platni promet</Label>
            <select
              className="mt-1.5 flex h-10 w-full rounded-lg border border-[var(--bd)] bg-[var(--card2)] px-3 text-[13.5px] text-[var(--tx)] outline-none focus:border-[var(--acc)]"
              value={fields.paymentTraffic}
              onChange={(e) => handleTrafficChange(e.target.value as PaymentTraffic)}
            >
              {(Object.keys(PAYMENT_TRAFFIC_LABELS) as PaymentTraffic[]).map((key) => (
                <option key={key} value={key}>
                  {PAYMENT_TRAFFIC_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Prefiks datoteka</Label>
            <Input
              className="font-mono"
              value={fields.filePrefix}
              onChange={(e) => updateField("filePrefix", e.target.value)}
              placeholder={defaultFilePrefix(fields.paymentTraffic as PaymentTraffic)}
              maxLength={16}
              required
            />
            <p className="mt-1.5 text-[11.5px] text-[var(--tx3)]">
              Podrazumevano: {defaultFilePrefix(fields.paymentTraffic as PaymentTraffic)} za{" "}
              {PAYMENT_TRAFFIC_LABELS[fields.paymentTraffic as PaymentTraffic].toLowerCase()}.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button type="submit" disabled={saving}>
            <Check className="size-4" />
            {saving ? "Čuvanje…" : "Sačuvaj"}
          </Button>
        </div>
        <FormMessage text={message?.text ?? null} ok={message?.ok} />
      </form>
    </Card>
  );
}
