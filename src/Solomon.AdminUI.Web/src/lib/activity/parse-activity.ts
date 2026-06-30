import type { ActivityEntry } from "@/lib/api/types";

export type LogLevel = "info" | "warn" | "error" | "all";

export interface ParsedLogEntry {
  id: string;
  timestamp: string;
  time: string;
  level: "info" | "warn" | "error";
  levelLabel: string;
  source: string;
  code: string;
  message: string;
}

const LEVEL_LABELS: Record<string, string> = {
  info: "Info",
  warn: "Upoz.",
  error: "Greška",
};

function inferSource(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("heartbeat") || lower.includes("websocket") || lower.includes("tls")) {
    return "WS";
  }
  if (lower.includes("job")) return "JOB";
  if (lower.includes("folder") || lower.includes("datotek") || lower.includes("file")) {
    return "FS";
  }
  return "SYS";
}

function inferCode(level: string, message: string, source: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("timeout")) return `${source}-408`;
  if (lower.includes("delivered") || lower.includes("isporuč")) return "JOB-OK";
  if (level === "error") return `${source}-ERR`;
  if (level === "warn") return `${source}-110`;
  return `${source}-200`;
}

export function parseActivityEntry(entry: ActivityEntry, index: number): ParsedLogEntry {
  const level = (entry.level === "warn" || entry.level === "error"
    ? entry.level
    : "info") as ParsedLogEntry["level"];
  const date = new Date(entry.timestamp);
  const source = inferSource(entry.message);

  return {
    id: `${entry.timestamp}-${index}`,
    timestamp: entry.timestamp,
    time: date.toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    level,
    levelLabel: LEVEL_LABELS[level] ?? "Info",
    source,
    code: inferCode(level, entry.message, source),
    message: entry.message,
  };
}

export function parseActivityEntries(entries: ActivityEntry[]): ParsedLogEntry[] {
  return entries.map(parseActivityEntry);
}

export function filterLogs(
  logs: ParsedLogEntry[],
  level: LogLevel,
  query: string,
): ParsedLogEntry[] {
  const q = query.trim().toLowerCase();
  return logs.filter((log) => {
    if (level !== "all" && log.level !== level) return false;
    if (!q) return true;
    return (
      log.message.toLowerCase().includes(q) ||
      log.code.toLowerCase().includes(q) ||
      log.source.toLowerCase().includes(q)
    );
  });
}

export function aggregateLogStats(logs: ParsedLogEntry[]) {
  const info = logs.filter((l) => l.level === "info").length;
  const warn = logs.filter((l) => l.level === "warn").length;
  const error = logs.filter((l) => l.level === "error").length;
  return { total: logs.length, info, warn, error };
}

export function topErrors(logs: ParsedLogEntry[], limit = 4) {
  const errors = logs.filter((l) => l.level === "error");
  const counts = new Map<string, { code: string; label: string; count: number }>();

  for (const log of errors) {
    const key = log.code;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { code: log.code, label: log.message, count: 1 });
    }
  }

  const sorted = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
  const max = sorted[0]?.count ?? 1;
  return sorted.map((item) => ({
    ...item,
    pct: Math.round((item.count / max) * 100),
  }));
}

export function exportLogsCsv(logs: ParsedLogEntry[]) {
  const header = "timestamp,level,source,code,message";
  const rows = logs.map((l) =>
    [l.timestamp, l.level, l.source, l.code, `"${l.message.replace(/"/g, '""')}"`].join(","),
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `solomon-activity-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
