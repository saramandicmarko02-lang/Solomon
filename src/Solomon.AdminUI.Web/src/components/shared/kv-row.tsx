import { cn } from "@/lib/utils";

interface KvRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function KvRow({ label, children, className }: KvRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3.5 border-b border-[var(--bd2)] py-[13px] last:border-b-0",
        className,
      )}
    >
      <span className="text-[12.5px] text-[var(--tx3)]">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

interface CardHeaderRowProps {
  icon: React.ReactNode;
  title: string;
  trailing?: React.ReactNode;
}

export function CardHeaderRow({ icon, title, trailing }: CardHeaderRowProps) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span className="text-[var(--tx2)]">{icon}</span>
      <span className="text-sm font-semibold">{title}</span>
      {trailing ? <div className="ml-auto">{trailing}</div> : null}
    </div>
  );
}

interface LegendDotProps {
  color: string;
  label: string;
  value?: string;
}

export function LegendDot({ color, label, value }: LegendDotProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />
      <span className="flex-1 text-[13px]">{label}</span>
      {value ? (
        <span className="font-mono text-[13px] font-bold">{value}</span>
      ) : null}
    </div>
  );
}
