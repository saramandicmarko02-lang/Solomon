"use client";

import { Card } from "@/components/ui/card";
import { PlaceholderPanel } from "@/components/shared/form-message";
import { ConnectionParamsForm } from "@/components/server/connection-params-form";
import { GappedDonut } from "@/components/charts/gapped-donut";
import { useStatus } from "@/lib/hooks/useStatus";
import { formatDate } from "@/lib/utils";
import { Activity, Clock } from "lucide-react";

export function ServerPage() {
  const { data, loading, error, refresh, setEditing } = useStatus();

  if (loading && !data) {
    return <PageShell loading />;
  }

  if (error || !data) {
    return <PageShell error={error ?? "Status nije dostupan."} />;
  }

  const connected = data.connected;
  const uptimeMock = 97.4;

  return (
    <div className="animate-fade-up max-w-[1320px] px-7 py-[26px] pb-12">
      <h1 className="m-0 text-2xl font-bold tracking-tight">Server i konekcija</h1>
      <p className="mt-1.5 text-[13.5px] text-[var(--tx2)]">
        WebSocket veza ka cloud serveru, parametri konekcije i merenje latencije.
      </p>

      <div className="mt-[22px] grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[1fr_300px]">
        <Card className="p-[22px]">
          <div className="mb-4 text-sm font-semibold">Parametri konekcije</div>
          <ConnectionParamsForm
            status={data}
            onSaved={() => void refresh()}
            onEditingChange={setEditing}
          />
        </Card>

        <Card className="flex flex-col items-center p-[22px]">
          <div className="mb-2 self-start text-[13px] font-semibold">WebSocket status</div>
          <GappedDonut
            size={150}
            innerRadius={43}
            outerRadius={56}
            segments={[
              { name: "up", value: uptimeMock, color: "var(--grn)" },
              { name: "down", value: 100 - uptimeMock, color: "var(--red)" },
            ]}
            centerTop={
              <span
                className="text-[13px] font-semibold"
                style={{ color: connected ? "var(--grn)" : "var(--red)" }}
              >
                {connected ? "Povezan" : "Offline"}
              </span>
            }
            centerBottom={
              <span className="text-[26px] font-bold tracking-tight">
                {connected ? "Online" : "—"}
              </span>
            }
          />
          <div className="mt-3 text-center text-xs text-[var(--tx2)]">
            Poslednji heartbeat
            <br />
            <span className="font-mono text-[var(--tx)]">
              {formatDate(data.lastSuccessfulHeartbeat)}
            </span>
          </div>
          {data.lastError ? (
            <div className="mt-2 text-center text-xs text-[var(--red)]">{data.lastError}</div>
          ) : null}
        </Card>
      </div>

      <div className="mt-[18px] grid grid-cols-1 gap-[18px] lg:grid-cols-[1.7fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="size-4 text-[var(--tx2)]" />
            <span className="text-sm font-semibold">Latencija (RTT) — poslednja 24h</span>
          </div>
          <PlaceholderPanel
            title="RTT grafikon — placeholder"
            description="Backend endpoint za RTT istoriju još ne postoji (Faza 9). Podaci će doći iz budućeg /api/metrics/connection."
            className="min-h-[190px]"
          />
        </Card>

        <Card className="p-5">
          <div className="mb-3.5 flex items-center gap-2">
            <Clock className="size-4 text-[var(--tx2)]" />
            <span className="text-sm font-semibold">Poslednja aktivnost</span>
          </div>
          <PlaceholderPanel
            title="Server activity feed — placeholder"
            description="Strukturirani feed konekcijskih događaja zahteva novi backend. Za sada koristite stranicu Aktivnost/Logovi (GET /api/activity)."
          />
        </Card>
      </div>
    </div>
  );
}

function PageShell({ loading, error }: { loading?: boolean; error?: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-[var(--tx2)]">
      {loading ? "Učitavanje…" : error}
    </div>
  );
}
