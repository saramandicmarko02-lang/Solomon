"use client";

import { useMemo, useState } from "react";
import { useActivity } from "@/lib/hooks/useActivity";
import {
  aggregateLogStats,
  exportLogsCsv,
  filterLogs,
  parseActivityEntries,
  topErrors,
  type LogLevel,
} from "@/lib/activity/parse-activity";
import { formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GappedDonut } from "@/components/charts/gapped-donut";
import { Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVEL_STYLES = {
  info: { bg: "var(--accbg)", color: "var(--acc2)" },
  warn: { bg: "var(--ambbg)", color: "var(--amb)" },
  error: { bg: "var(--redbg)", color: "var(--red)" },
};

function LogTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-[7px] border-none px-3 py-1.5 text-[12.5px] font-semibold whitespace-nowrap",
        active ? "bg-[var(--acc)] text-[#06121f]" : "bg-transparent text-[var(--tx2)]",
      )}
    >
      {children}
    </button>
  );
}

export function LogsPage() {
  const { data, loading, error } = useActivity();
  const [level, setLevel] = useState<LogLevel>("all");
  const [query, setQuery] = useState("");

  const parsed = useMemo(() => parseActivityEntries(data), [data]);
  const filtered = useMemo(() => filterLogs(parsed, level, query), [parsed, level, query]);
  const stats = useMemo(() => aggregateLogStats(parsed), [parsed]);
  const errors = useMemo(() => topErrors(parsed), [parsed]);

  const donutSegments = useMemo(() => {
    if (stats.total === 0) {
      return [{ name: "empty", value: 1, color: "rgba(148,163,184,0.2)" }];
    }
    return [
      { name: "info", value: stats.info, color: "var(--acc)" },
      { name: "warn", value: stats.warn, color: "var(--amb)" },
      { name: "error", value: stats.error, color: "var(--red)" },
    ].filter((s) => s.value > 0);
  }, [stats]);

  if (loading && parsed.length === 0) {
    return <Centered>Učitavanje logova…</Centered>;
  }

  return (
    <div className="animate-fade-up max-w-[1320px] px-7 py-[26px] pb-12">
      <h1 className="m-0 text-2xl font-bold tracking-tight">Aktivnost / Logovi</h1>
      <p className="mt-1.5 text-[13.5px] text-[var(--tx2)]">
        Događaji agenta — podaci sa GET /api/activity, agregacija client-side.
      </p>
      {error ? <p className="mt-2 text-sm text-[var(--red)]">{error}</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatTile label="Ukupno događaja" value={stats.total} />
        <StatTile label="Info" value={stats.info} dotColor="var(--acc)" valueColor="var(--tx)" />
        <StatTile label="Upozorenja" value={stats.warn} dotColor="var(--amb)" valueColor="var(--amb)" />
        <StatTile label="Greške" value={stats.error} dotColor="var(--red)" valueColor="var(--red)" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="inline-flex gap-0.5 rounded-[9px] border border-[var(--bd)] bg-[var(--card2)] p-0.5">
          <LogTab active={level === "all"} onClick={() => setLevel("all")}>Sve</LogTab>
          <LogTab active={level === "info"} onClick={() => setLevel("info")}>Info</LogTab>
          <LogTab active={level === "warn"} onClick={() => setLevel("warn")}>Upoz.</LogTab>
          <LogTab active={level === "error"} onClick={() => setLevel("error")}>Greške</LogTab>
        </div>
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-[15px] -translate-y-1/2 text-[var(--tx3)]" />
          <Input
            className="h-10 pl-9"
            placeholder="Pretraga po kodu ili poruci…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10"
          onClick={() => exportLogsCsv(filtered)}
          disabled={filtered.length === 0}
        >
          <Download className="size-4" />
          Izvezi CSV
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[96px_78px_84px_1fr] gap-3 border-b border-[var(--bd)] px-[18px] py-2.5 text-[10.5px] font-bold tracking-[0.05em] text-[var(--tx3)]">
            <div>VREME</div>
            <div>NIVO</div>
            <div>IZVOR</div>
            <div>PORUKA</div>
          </div>
          {filtered.length === 0 ? (
            <div className="px-[18px] py-8 text-center text-sm text-[var(--tx3)]">
              Nema događaja za izabrane filtere.
            </div>
          ) : (
            filtered.map((log) => {
              const style = LEVEL_STYLES[log.level];
              return (
                <div
                  key={log.id}
                  className="row-hover grid grid-cols-[96px_78px_84px_1fr] gap-3 border-b border-[var(--bd2)] px-[18px] py-2.5 hover:bg-white/[0.025]"
                >
                  <div className="font-mono text-xs text-[var(--tx3)]">{log.time}</div>
                  <div>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {log.levelLabel}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-[var(--tx2)]">{log.source}</div>
                  <div className="truncate text-[12.5px] text-[var(--tx2)]">
                    <span className="font-mono text-[var(--tx3)]">{log.code}</span> {log.message}
                  </div>
                </div>
              );
            })
          )}
        </Card>

        <div className="flex flex-col gap-[18px]">
          <Card className="p-5">
            <div className="mb-3.5 text-[13.5px] font-semibold">Raspodela događaja</div>
            <div className="flex items-center gap-4">
              <GappedDonut size={92} innerRadius={27} outerRadius={34} paddingAngle={3} segments={donutSegments} />
              <div className="flex-1 text-xs text-[var(--tx2)]">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="size-2 rounded-[3px] bg-[var(--acc)]" />
                  Info
                  <span className="ml-auto font-mono text-[var(--tx)]">
                    {stats.total ? Math.round((stats.info / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="size-2 rounded-[3px] bg-[var(--amb)]" />
                  Upoz.
                  <span className="ml-auto font-mono text-[var(--tx)]">
                    {stats.total ? Math.round((stats.warn / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-[3px] bg-[var(--red)]" />
                  Greške
                  <span className="ml-auto font-mono text-[var(--tx)]">
                    {stats.total ? Math.round((stats.error / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3.5 text-[13.5px] font-semibold">Najčešće greške</div>
            {errors.length === 0 ? (
              <p className="text-sm text-[var(--tx3)]">Nema grešaka u trenutnom skupu.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {errors.map((e) => (
                  <div key={e.code}>
                    <div className="mb-1 flex items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-[var(--red)]">{e.code}</span>
                      <span className="min-w-0 flex-1 truncate text-[var(--tx2)]">{e.label}</span>
                      <span className="font-mono font-semibold">{e.count}</span>
                    </div>
                    <div className="h-[7px] overflow-hidden rounded-full bg-[rgba(148,163,184,0.1)]">
                      <div
                        className="h-full rounded-full bg-[var(--red)]"
                        style={{ width: `${e.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  dotColor,
  valueColor = "var(--tx)",
}: {
  label: string;
  value: number;
  dotColor?: string;
  valueColor?: string;
}) {
  return (
    <Card className="px-[18px] py-[15px]">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] text-[var(--tx3)]">
        {dotColor ? <span className="size-2 rounded-[3px]" style={{ background: dotColor }} /> : null}
        {label}
      </div>
      <div
        className="font-mono text-[26px] font-bold tracking-tight"
        style={{ color: valueColor }}
      >
        {formatNumber(value)}
      </div>
    </Card>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-64 items-center justify-center text-[var(--tx2)]">{children}</div>
  );
}
