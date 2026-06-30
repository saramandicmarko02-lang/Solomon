import { fetchJson } from "./client";
import type { OverviewMetrics } from "./types";

export interface OverviewApiResponse {
  refreshedAt: string;
  solomonVersion: string;
  connection: {
    connected: boolean;
    statusLabel: string;
    uptimePercent24h: number;
    connectedSeconds24h: number;
    disconnectedSeconds24h: number;
    lastStatusChangeAt: string | null;
    lastStatusLabel: string;
  };
  agent: {
    agentId: string | null;
    hostname: string;
    enrolled: boolean;
    serverUrl: string;
  };
  heartbeat: {
    intervalSeconds: number;
    averageLatencyMs: number;
    samples: Array<{ at: string; success: boolean; latencyMs: number | null }>;
    lastError: string | null;
    lastErrorAt: string | null;
  };
  health: {
    diskLabel: string;
    diskUsedPercent: number;
    diskUsedBytes: number;
    diskTotalBytes: number;
    healthChecksPassed: number;
    healthChecksTotal: number;
    checks: Array<{ id: string; label: string; passed: boolean }>;
    detectedFolderCount: number;
  };
  jobs: {
    delivered24h: number;
    failed24h: number;
    dailyStats: Array<{ date: string; delivered: number; failed: number }>;
  };
}

function shortAgentId(id: string | null | undefined): string {
  if (!id) return "—";
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function bytesToGb(bytes: number): number {
  return Math.round((bytes / 1024 / 1024 / 1024) * 10) / 10;
}

function diskStatus(percent: number): {
  label: string;
  color: "green" | "yellow" | "red";
} {
  if (percent >= 90) return { label: "Kritično · prag 90%", color: "red" };
  if (percent >= 70) return { label: "Upozorenje · prag 70%", color: "yellow" };
  return { label: "U redu · prag 70%", color: "green" };
}

function formatErrorTime(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString("sr-RS", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return null;
  }
}

function secondsAgo(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
}

export function mapOverviewResponse(data: OverviewApiResponse): OverviewMetrics {
  const disk = diskStatus(data.health.diskUsedPercent);
  const refreshedSecondsAgo = secondsAgo(data.refreshedAt);

  return {
    refreshedSecondsAgo,
    connection: {
      connected: data.connection.connected,
      statusLabel: data.connection.statusLabel,
      uptimePercent24h: data.connection.uptimePercent24h,
      connectedDurationSeconds: data.connection.connectedSeconds24h,
      disconnectedDurationSeconds: data.connection.disconnectedSeconds24h,
      lastStatusChangeSecondsAgo: secondsAgo(data.connection.lastStatusChangeAt),
      lastStatusLabel: data.connection.lastStatusLabel,
    },
    agent: {
      agentId: data.agent.agentId ?? "",
      agentIdShort: shortAgentId(data.agent.agentId),
      hostname: data.agent.hostname,
      solomonVersion: data.solomonVersion,
      enrolled: data.agent.enrolled,
      enrollmentLabel: data.agent.enrolled ? "Registrovan" : "Nije registrovan",
      serverUrl: data.agent.serverUrl ?? "",
    },
    heartbeat: {
      intervalSeconds: data.heartbeat.intervalSeconds,
      averageLatencyMs: data.heartbeat.averageLatencyMs,
      samples: data.heartbeat.samples.map((s) => ({
        timestamp: s.at,
        latencyMs: s.latencyMs ?? 0,
        success: s.success,
      })),
      lastError: data.heartbeat.lastError,
      lastErrorTime: formatErrorTime(data.heartbeat.lastErrorAt),
    },
    health: {
      diskLabel: data.health.diskLabel,
      diskUsedPercent: data.health.diskUsedPercent,
      diskUsedGb: bytesToGb(data.health.diskUsedBytes),
      diskTotalGb: bytesToGb(data.health.diskTotalBytes),
      diskStatusLabel: disk.label,
      diskStatusColor: disk.color,
      healthChecksPassed: data.health.healthChecksPassed,
      healthChecksTotal: data.health.healthChecksTotal,
      healthChecks: data.health.checks.map((c) => ({
        id: c.id,
        label: c.label,
        passed: c.passed,
      })),
      detectedFolderCount: data.health.detectedFolderCount,
    },
    jobs: {
      delivered24h: data.jobs.delivered24h,
      failed24h: data.jobs.failed24h,
      total24h: data.jobs.delivered24h + data.jobs.failed24h,
      dailyStats: data.jobs.dailyStats.map((d) => ({
        date: d.date,
        label: d.date.slice(8, 10) + "." + d.date.slice(5, 7),
        delivered: d.delivered,
        failed: d.failed,
      })),
    },
  };
}

export async function fetchOverviewMetrics(): Promise<OverviewMetrics> {
  const data = await fetchJson<OverviewApiResponse>("/api/overview");
  return mapOverviewResponse(data);
}
