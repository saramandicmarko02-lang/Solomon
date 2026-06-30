"use client";

import type { OverviewMetrics } from "@/lib/api/types";
import type { PageId } from "@/lib/navigation";
import { formatRelativeSeconds } from "@/lib/utils";
import { useOverviewMetrics } from "@/lib/hooks/useOverviewMetrics";
import { AgentIdentityCard } from "@/components/overview/agent-identity-card";
import { ConnectionUptimeCard } from "@/components/overview/connection-uptime-card";
import { HeartbeatHistoryCard } from "@/components/overview/heartbeat-history-card";
import { JobActivityCard } from "@/components/overview/job-activity-card";
import { SystemHealthCard } from "@/components/overview/system-health-card";
import { Clock } from "lucide-react";

interface OverviewPageProps {
  onNavigate: (page: PageId) => void;
}

function OverviewContent({
  data,
  onNavigate,
}: {
  data: OverviewMetrics;
  onNavigate: (page: PageId) => void;
}) {
  return (
    <div className="animate-fade-up px-7 py-[26px] pb-12">
      <div className="mb-[22px] flex items-end justify-between gap-5">
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-tight">Pregled</h1>
          <p className="mt-1.5 text-[13.5px] text-[var(--tx2)]">
            Da li sve radi — sažetak stanja agenta i konekcije.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--tx3)]">
          <Clock className="size-3.5" />
          Osveženo {formatRelativeSeconds(data.refreshedSecondsAgo)}
        </div>
      </div>

      <div className="mb-[18px] grid grid-cols-1 gap-[18px] xl:grid-cols-[minmax(300px,5fr)_minmax(360px,7fr)]">
        <ConnectionUptimeCard data={data.connection} />
        <AgentIdentityCard data={data.agent} />
      </div>

      <div className="mb-[18px] grid grid-cols-1 gap-[18px] xl:grid-cols-[minmax(360px,7fr)_minmax(300px,5fr)]">
        <HeartbeatHistoryCard data={data.heartbeat} onGoToLogs={onNavigate} />
        <SystemHealthCard data={data.health} />
      </div>

      <JobActivityCard data={data.jobs} />
    </div>
  );
}

export function OverviewPage({ onNavigate }: OverviewPageProps) {
  const { data, loading, error } = useOverviewMetrics();

  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--tx2)]">
        Učitavanje pregleda…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--red)]">
        {error ?? "Nije moguće učitati podatke."}
      </div>
    );
  }

  return <OverviewContent data={data} onNavigate={onNavigate} />;
}
