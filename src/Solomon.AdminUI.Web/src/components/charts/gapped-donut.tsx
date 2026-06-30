"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

interface GappedDonutProps {
  segments: DonutSegment[];
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  centerTop?: React.ReactNode;
  centerBottom?: React.ReactNode;
  className?: string;
}

export function GappedDonut({
  segments,
  size = 146,
  innerRadius = 43,
  outerRadius = 56,
  paddingAngle = 4,
  centerTop,
  centerBottom,
  className,
}: GappedDonutProps) {
  const chartConfig = Object.fromEntries(
    segments.map((s) => [s.name, { label: s.name, color: s.color }]),
  );

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <ChartContainer config={chartConfig} className="size-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[{ value: 1 }]}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              stroke="none"
              fill="rgba(148,163,184,0.07)"
              isAnimationActive={false}
            />
            <Pie
              data={segments}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              startAngle={90}
              endAngle={-270}
              paddingAngle={paddingAngle}
              stroke="none"
              cornerRadius={4}
              isAnimationActive={false}
            >
              {segments.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      {(centerTop || centerBottom) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerTop}
          {centerBottom}
        </div>
      )}
    </div>
  );
}
