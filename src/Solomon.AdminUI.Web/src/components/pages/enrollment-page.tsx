"use client";

import { useState } from "react";
import { postEnroll, postUnenroll } from "@/lib/api/client";
import { useStatus } from "@/lib/hooks/useStatus";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { KvRow } from "@/components/shared/kv-row";
import { CheckCircle2, IdCard, Key } from "lucide-react";

export function EnrollmentPage() {
  const { data, loading, error, refresh } = useStatus();
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading && !data) {
    return <Centered>Učitavanje…</Centered>;
  }

  if (error || !data) {
    return <Centered>{error ?? "Status nije dostupan."}</Centered>;
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const result = await postEnroll({
        enrollmentCode,
        serverBaseUrl: data!.serverBaseUrl || undefined,
      });
      setMessage({ text: result.message, ok: true });
      setEnrollmentCode("");
      await refresh();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Registracija nije uspela.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUnenroll() {
    if (!confirm("Ukloniti registraciju agenta? Konekcija će biti prekinuta.")) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await postUnenroll();
      setMessage({ text: result.message, ok: true });
      await refresh();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Uklanjanje nije uspelo.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-up max-w-[1180px] px-7 py-[26px] pb-12">
      <h1 className="m-0 text-2xl font-bold tracking-tight">Registracija</h1>
      <p className="mt-1.5 text-[13.5px] text-[var(--tx2)]">
        Enrollment agenta na cloud serveru pomoću jednokratnog koda.
      </p>

      <div className="mt-[22px] grid grid-cols-1 items-start gap-[18px] lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card className="flex items-center gap-3.5 p-5">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-[11px]"
              style={{
                background: data.enrolled ? "var(--grnbg)" : "var(--redbg)",
                color: data.enrolled ? "var(--grn)" : "var(--red)",
              }}
            >
              <CheckCircle2 className="size-[22px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">
                {data.enrolled ? "Agent registrovan" : "Agent nije registrovan"}
              </div>
              <div className="mt-0.5 text-[12.5px] text-[var(--tx2)]">
                {data.enrolled && data.agentId
                  ? `ID: ${data.agentId}`
                  : "Unesite enrollment kod iz web aplikacije."}
              </div>
            </div>
            {data.enrolled ? (
              <Button variant="outline" className="h-9 text-[12.5px]" onClick={() => void handleUnenroll()} disabled={busy}>
                Poništi
              </Button>
            ) : null}
          </Card>

          <Card className="px-5 pb-2 pt-1">
            <div className="flex items-center gap-2 py-3.5">
              <IdCard className="size-4 text-[var(--tx2)]" />
              <span className="text-sm font-semibold">Detalji registracije</span>
              <span className="ml-auto rounded-full bg-[var(--ambbg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--amb)]">
                Mock · cloud integracija kasnije
              </span>
            </div>
            <KvRow label="Organizacija">
              <span className="text-[13px] font-semibold">Halcom a.d. Beograd</span>
            </KvRow>
            <KvRow label="Naziv agenta">
              <span className="font-mono text-[12.5px] font-semibold">WIN-SRV-01 — Beograd</span>
            </KvRow>
            <KvRow label="Sertifikat (QES)">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--grn)]">
                <CheckCircle2 className="size-[15px]" />
                Važeći
              </span>
            </KvRow>
            <KvRow label="Ističe">
              <span className="font-mono text-[12.5px] font-semibold">12.03.2027</span>
            </KvRow>
          </Card>

          <Card className="p-5">
            <div className="mb-3.5 text-sm font-semibold">
              {data.enrolled ? "Ponovna registracija" : "Registracija agenta"}
            </div>
            <form onSubmit={(e) => void handleEnroll(e)} className="flex flex-col gap-3.5">
              <div>
                <Label>Enrollment kod</Label>
                <Input
                  className="font-mono"
                  type="password"
                  autoComplete="off"
                  value={enrollmentCode}
                  onChange={(e) => setEnrollmentCode(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  required
                />
              </div>
              <Button type="submit" disabled={busy}>
                <Key className="size-4" />
                {busy ? "Registracija…" : "Registruj agenta"}
              </Button>
            </form>
            <FormMessage text={message?.text ?? null} ok={message?.ok} />
          </Card>
        </div>

        <Card className="p-5">
          <div className="mb-3 text-sm font-semibold">Trenutni status (API)</div>
          <KvRow label="Registrovan">
            <span className="font-mono text-[13px] font-semibold">
              {data.enrolled ? "Da" : "Ne"}
            </span>
          </KvRow>
          <KvRow label="Agent ID">
            <span className="font-mono text-[12.5px]">{data.agentId ?? "—"}</span>
          </KvRow>
          <KvRow label="WebSocket">
            <span
              className="text-[13px] font-semibold"
              style={{ color: data.connected ? "var(--grn)" : "var(--red)" }}
            >
              {data.connected ? "Povezan" : "Nije povezan"}
            </span>
          </KvRow>
          <KvRow label="Server URL">
            <span className="font-mono text-[12.5px] text-[var(--tx2)]">
              {data.serverBaseUrl || "—"}
            </span>
          </KvRow>
        </Card>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-64 items-center justify-center text-[var(--tx2)]">{children}</div>
  );
}
