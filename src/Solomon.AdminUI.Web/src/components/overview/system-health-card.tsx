"use client";

import type { SystemHealthMetrics } from "@/lib/api/types";
import { GappedDonut } from "@/components/charts/gapped-donut";
import { Card } from "@/components/ui/card";
import { CardHeaderRow } from "@/components/shared/kv-row";
import { Cpu, HardDrive } from "lucide-react";

interface SystemHealthCardProps {
  data: SystemHealthMetrics;
}

function diskColor(percent: number): string {
  if (percent >= 90) return "var(--red)";
  if (percent >= 70) return "var(--amb)";
  return "var(--grn)";
}

export function SystemHealthCard({ data }: SystemHealthCardProps) {
  const freePct = 100 - data.diskUsedPercent;
  const diskStroke = diskColor(data.diskUsedPercent);
  const checksPct =
    data.healthChecksTotal > 0
      ? (data.healthChecksPassed / data.healthChecksTotal) * 100
      : 0;

  return (
    <Card className="flex flex-col p-5">
      <CardHeaderRow icon={<Cpu className="size-4" />} title="Zdravlje sistema" />
      <div className="mt-3.5 flex items-center gap-[18px]">
        <GappedDonut
          size={124}
          innerRadius={37}
          outerRadius={48}
          paddingAngle={3}
          segments={[
            { name: "used", value: data.diskUsedPercent, color: diskStroke },
            { name: "free", value: freePct, color: "rgba(148,163,184,0.16)" },
          ]}
          centerTop={
            <span className="text-2xl font-bold tracking-tight text-[var(--tx)]">
              {data.diskUsedPercent}%
            </span>
          }
          centerBottom={
            <span className="text-[10.5px] font-medium text-[var(--tx3)]">iskorišćeno</span>
          }
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-[12.5px] text-[var(--tx2)]">
            <HardDrive className="size-3.5 text-[var(--tx3)]" />
            {data.diskLabel}
          </div>
          <div className="font-mono text-[13px] text-[var(--tx)]">
            {data.diskUsedGb} GB / {data.diskTotalGb} GB
          </div>
          <div
            className="mt-0.5 text-[11.5px] font-semibold"
            style={{
              color:
                data.diskStatusColor === "green"
                  ? "var(--grn)"
                  : data.diskStatusColor === "yellow"
                    ? "var(--amb)"
                    : "var(--red)",
            }}
          >
            {data.diskStatusLabel}
          </div>
        </div>
      </div>
      <div className="mt-[18px] grid grid-cols-2 gap-3 border-t border-[var(--bd2)] pt-4">
        <div className="flex items-center gap-3">
          <GappedDonut
            size={66}
            innerRadius={17}
            outerRadius={25}
            paddingAngle={0}
            segments={[
              { name: "passed", value: checksPct, color: "var(--grn)" },
              { name: "failed", value: 100 - checksPct, color: "rgba(148,163,184,0.1)" },
            ]}
            centerTop={
              <span className="text-[15px] font-bold text-[var(--tx)]">
                {data.healthChecksPassed}/{data.healthChecksTotal}
              </span>
            }
          />
          <div>
            <div className="text-[13px] font-semibold">Provere</div>
            <div className="text-[11.5px] text-[var(--tx3)]">
              {data.healthChecksPassed === data.healthChecksTotal
                ? "sve prošle"
                : "delimično"}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <div className="font-mono text-[30px] font-bold leading-none tracking-tight">
            {data.detectedFolderCount}
          </div>
          <div className="mt-1.5 text-[11.5px] text-[var(--tx3)]">foldera detektovano</div>
        </div>
      </div>
    </Card>
  );
}
