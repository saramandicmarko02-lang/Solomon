"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { JobActivityMetrics } from "@/lib/api/types";
import { formatNumber } from "@/lib/utils";
import { GappedDonut } from "@/components/charts/gapped-donut";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { CardHeaderRow } from "@/components/shared/kv-row";
import { Zap } from "lucide-react";

interface JobActivityCardProps {
  data: JobActivityMetrics;
}

export function JobActivityCard({ data }: JobActivityCardProps) {
  const failPct = data.total24h > 0 ? (data.failed24h / data.total24h) * 100 : 0;
  const okPct = 100 - failPct;

  const barData = data.dailyStats.map((day) => ({
    label: day.label,
    delivered: day.delivered,
    failed: day.failed,
    total: day.delivered + day.failed,
  }));

  return (
    <Card className="p-5">
      <CardHeaderRow
        icon={<Zap className="size-4" />}
        title="Aktivnost poslova"
        trailing={
          <span className="text-[11.5px] text-[var(--tx3)]">poslednja 24h · 7 dana</span>
        }
      />
      <div className="mt-4 grid grid-cols-1 items-center gap-6 xl:grid-cols-[minmax(240px,3fr)_minmax(380px,7fr)]">
        <div className="flex items-center gap-[18px] border-[var(--bd2)] xl:border-r xl:pr-[22px]">
          <GappedDonut
            size={132}
            innerRadius={38}
            outerRadius={50}
            paddingAngle={3}
            segments={[
              { name: "delivered", value: okPct, color: "var(--grn)" },
              { name: "failed", value: failPct, color: "var(--red)" },
            ]}
            centerTop={
              <span className="text-[25px] font-bold tracking-tight text-[var(--tx)]">
                {formatNumber(data.total24h)}
              </span>
            }
            centerBottom={
              <span className="text-[10.5px] font-medium text-[var(--tx3)]">poslova / 24h</span>
            }
          />
          <div className="min-w-0 flex-1">
            <div className="mb-3">
              <div className="mb-0.5 flex items-center gap-2 text-[12.5px] text-[var(--tx2)]">
                <span className="size-2 rounded-[3px] bg-[var(--grn)]" />
                Isporučeno
              </div>
              <div className="font-mono text-lg font-bold">{formatNumber(data.delivered24h)}</div>
            </div>
            <div>
              <div className="mb-0.5 flex items-center gap-2 text-[12.5px] text-[var(--tx2)]">
                <span className="size-2 rounded-[3px] bg-[var(--red)]" />
                Neuspešno
              </div>
              <div className="font-mono text-lg font-bold text-[var(--red)]">
                {formatNumber(data.failed24h)}
              </div>
            </div>
          </div>
        </div>
        <ChartContainer
          config={{
            delivered: { label: "Isporučeno", color: "var(--grn)" },
            failed: { label: "Neuspešno", color: "var(--red)" },
          }}
          className="h-[220px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10.5, fill: "var(--tx3)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={36}
                tick={{ fontSize: 10, fill: "var(--tx3)" }}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="delivered" stackId="jobs" fill="var(--grn)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="failed" stackId="jobs" fill="var(--red)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </Card>
  );
}
