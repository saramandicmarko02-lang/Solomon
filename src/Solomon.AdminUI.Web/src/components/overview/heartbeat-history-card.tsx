"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { HeartbeatHistoryMetrics } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { CardHeaderRow } from "@/components/shared/kv-row";
import { Activity, AlertTriangle, ChevronRight } from "lucide-react";
import type { PageId } from "@/lib/navigation";

interface HeartbeatHistoryCardProps {
  data: HeartbeatHistoryMetrics;
  onGoToLogs?: (page: PageId) => void;
}

export function HeartbeatHistoryCard({ data, onGoToLogs }: HeartbeatHistoryCardProps) {
  const chartData = data.samples.map((sample, index) => ({
    index,
    time: new Date(sample.timestamp).toLocaleTimeString("sr-RS", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    latencyMs: sample.latencyMs,
    success: sample.success ? 1 : 0,
    status: sample.success ? "ok" : "miss",
  }));

  return (
    <Card className="flex flex-col p-5">
      <CardHeaderRow
        icon={<Activity className="size-4" />}
        title="Heartbeat istorija"
        trailing={
          <span className="text-[11.5px] text-[var(--tx3)]">
            poslednji sat · interval {data.intervalSeconds}s
          </span>
        }
      />
      <div className="my-1.5 flex items-center gap-4 text-[11.5px] text-[var(--tx2)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[var(--grn)]" />
          Na vreme
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[var(--red)]" />
          Promašen / kasni
        </span>
        <span className="ml-auto font-mono">prosek {data.averageLatencyMs}ms</span>
      </div>
      <ChartContainer
        config={{
          ok: { label: "Na vreme", color: "var(--grn)" },
          miss: { label: "Promašen", color: "var(--red)" },
        }}
        className="h-[160px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              tick={{ fontSize: 10, fill: "var(--tx3)" }}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 1]}
              tickFormatter={(v) => (v === 1 ? "1" : "0")}
              tickLine={false}
              axisLine={false}
              width={28}
              tick={{ fontSize: 10, fill: "var(--tx3)" }}
            />
            <Tooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="success"
              stroke="var(--grn)"
              strokeWidth={2}
              dot={({ cx, cy, payload }) =>
                payload?.status === "miss" ? (
                  <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="var(--red)" />
                ) : (
                  <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="var(--grn)" />
                )
              }
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="mt-2.5 flex items-center gap-2 border-t border-[var(--bd2)] pt-3">
        <AlertTriangle className="size-[15px] shrink-0 text-[var(--red)]" />
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--tx2)]">
          Poslednja greška:{" "}
          <span className="text-[var(--tx)]">
            {data.lastError}
            {data.lastErrorTime ? ` (${data.lastErrorTime})` : ""}
          </span>
        </span>
        <button
          type="button"
          onClick={() => onGoToLogs?.("logs")}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-[12.5px] font-semibold text-[var(--acc2)]"
        >
          Vidi detalje
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </Card>
  );
}
