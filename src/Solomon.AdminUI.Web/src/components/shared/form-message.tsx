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
