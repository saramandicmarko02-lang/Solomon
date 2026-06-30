"use client";

import type { ConnectionUptimeMetrics } from "@/lib/api/types";
import { formatDuration, formatRelativeSeconds } from "@/lib/utils";
import { GappedDonut } from "@/components/charts/gapped-donut";
import { Card } from "@/components/ui/card";
import { CardHeaderRow, LegendDot } from "@/components/shared/kv-row";
import { Wifi } from "lucide-react";

interface ConnectionUptimeCardProps {
  data: ConnectionUptimeMetrics;
}

export function ConnectionUptimeCard({ data }: ConnectionUptimeCardProps) {
  const disconnectedPct = 100 - data.uptimePercent24h;

  return (
    <Card className="flex flex-col p-5">
      <CardHeaderRow icon={<Wifi className="size-4" />} title="Status konekcije" />
      <div className="mt-2 flex items-center gap-[18px]">
        <GappedDonut
          size={146}
          innerRadius={43}
          outerRadius={56}
          segments={[
            { name: "connected", value: data.uptimePercent24h, color: "var(--grn)" },
            { name: "disconnected", value: disconnectedPct, color: "var(--red)" },
          ]}
          centerTop={
            <span
              className="text-[13px] font-semibold"
              style={{ color: data.connected ? "var(--grn)" : "var(--red)" }}
            >
              {data.statusLabel}
            </span>
          }
          centerBottom={
            <span className="text-[27px] font-bold tracking-tight text-[var(--tx)]">
              {data.uptimePercent24h.toFixed(1)}%
            </span>
          }
        />
        <div className="min-w-0 flex-1">
          <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[var(--tx3)]">
            Poslednja 24h
          </div>
          <div className="flex flex-col gap-2">
            <LegendDot
              color="var(--grn)"
              label="Povezano"
              value={formatDuration(data.connectedDurationSeconds)}
            />
            <LegendDot
              color="var(--red)"
              label="Prekid"
              value={formatDuration(data.disconnectedDurationSeconds)}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 border-t border-[var(--bd2)] pt-3 text-xs text-[var(--tx2)]">
        Poslednja promena statusa:{" "}
        <span className="font-semibold text-[var(--tx)]">
          {formatRelativeSeconds(data.lastStatusChangeSecondsAgo)}
        </span>{" "}
        → {data.lastStatusLabel}
      </div>
    </Card>
  );
}
