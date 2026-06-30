"use client";

import { cn } from "@/lib/utils";

export function FormMessage({
  text,
  ok,
  className,
}: {
  text: string | null;
  ok?: boolean;
  className?: string;
}) {
  if (!text) return null;
  return (
    <p
      className={cn(
        "mt-3 text-[13px]",
        ok ? "text-[var(--grn)]" : "text-[var(--red)]",
        className,
      )}
    >
      {text}
    </p>
  );
}

export function PlaceholderPanel({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[var(--bd)] bg-[var(--card2)] px-6 py-10 text-center",
        className,
      )}
    >
      <div className="text-sm font-semibold text-[var(--tx2)]">{title}</div>
      <p className="mt-2 max-w-md text-[13px] text-[var(--tx3)]">{description}</p>
    </div>
  );
}
