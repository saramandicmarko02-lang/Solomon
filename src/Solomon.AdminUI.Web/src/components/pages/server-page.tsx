"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ConnectionParamsForm } from "@/components/server/connection-params-form";
import { HeartbeatHistoryCard } from "@/components/overview/heartbeat-history-card";
import { GappedDonut } from "@/components/charts/gapped-donut";
import { useStatus } from "@/lib/hooks/useStatus";
import { useOverviewMetrics } from "@/lib/hooks/useOverviewMetrics";
import { useActivity } from "@/lib/hooks/useActivity";
import { parseActivityEntries } from "@/lib/activity/parse-activity";
import { formatDate, formatDuration } from "@/lib/utils";
import { Clock } from "lucide-react";

export function ServerPage() {
  const { data, loading, error, refresh, setEditing } = useStatus();
  const { data: overview } = useOverviewMetrics();
  const { data: activity } = useActivity();

  const recentActivity = useMemo(
    () => parseActivityEntries(activity).slice(0, 8),
    [activity],
  );

  if (loading && !data) {
    return <PageShell loading />;
  }

  if (error || !data) {
    return <PageShell error={error ?? "Status nije dostupan."} />;
  }

  const connected = data.connected;
  const uptime = overview?.connection;
  const uptimePct = uptime?.uptimePercent24h ?? (connected ? 100 : 0);
  const donutSegments = [
    { name: "up", value: Math.max(uptimePct, 0.1), color: "var(--grn)" },
    ...(uptimePct < 99.9
      ? [{ name: "down", value: 100 - uptimePct, color: "var(--red)" }]
      : []),
  ];

  return (
    <div className="animate-fade-up max-w-[1320px] px-7 py-[26px] pb-12">
      <h1 className="m-0 text-2xl font-bold tracking-tight">Server i konekcija</h1>
      <p className="mt-1.5 text-[13.5px] text-[var(--tx2)]">
        WebSocket veza ka cloud serveru i parametri konekcije.
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
          <div className="mb-2 self-start text-[13px] font-semibold">WebSocket uptime (24h)</div>
          <GappedDonut
            size={150}
            innerRadius={43}
            outerRadius={56}
            segments={donutSegments}
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
                {uptimePct.toFixed(1)}%
              </span>
            }
          />
          {uptime ? (
            <div className="mt-2 text-center text-[11px] text-[var(--tx3)]">
              Povezano {formatDuration(uptime.connectedDurationSeconds)}
              {uptime.disconnectedDurationSeconds > 0
                ? ` · prekid ${formatDuration(uptime.disconnectedDurationSeconds)}`
                : ""}
            </div>
          ) : null}
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
        {overview ? (
          <HeartbeatHistoryCard data={overview.heartbeat} />
        ) : (
          <Card className="flex h-48 items-center justify-center p-5 text-sm text-[var(--tx3)]">
            Učitavanje heartbeat istorije…
          </Card>
        )}

        <Card className="p-5">
          <div className="mb-3.5 flex items-center gap-2">
            <Clock className="size-4 text-[var(--tx2)]" />
            <span className="text-sm font-semibold">Poslednja aktivnost</span>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[var(--tx3)]">Nema zabeleženih događaja.</p>
          ) : (
            <div className="flex flex-col">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-[var(--bd2)] py-2.5 last:border-b-0"
                >
                  <div className="text-[13px] text-[var(--tx)]">{item.message}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-[var(--tx3)]">
                    {item.time} · {item.levelLabel}
                  </div>
                </div>
              ))}
            </div>
          )}
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
