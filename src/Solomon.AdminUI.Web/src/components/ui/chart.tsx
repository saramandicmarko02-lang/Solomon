"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChartConfig {
  [key: string]: {
    label?: string;
    color?: string;
  };
}

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a ChartContainer");
  }
  return context;
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { config: ChartConfig }) {
  const style = React.useMemo(() => {
    const entries = Object.entries(config).filter(([, item]) => item.color);
    if (!entries.length) return undefined;
    return Object.fromEntries(
      entries.map(([key, item]) => [`--color-${key}`, item.color]),
    ) as React.CSSProperties;
  }, [config]);

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-[var(--tx3)] [&_.recharts-cartesian-grid_line]:stroke-[rgba(148,163,184,0.09)]",
          className,
        )}
        style={style}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--bd)] bg-[var(--card2)] px-3 py-2 text-xs shadow-xl">
      {label && <div className="mb-1 text-[var(--tx3)]">{label}</div>}
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 font-mono text-[var(--tx)]">
          <span
            className="size-2 rounded-sm"
            style={{ background: item.color ?? "var(--acc)" }}
          />
          {item.name}: {item.value}
        </div>
      ))}
    </div>
  );
}
