import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-[42px] w-full rounded-[9px] border border-[var(--bd)] bg-[var(--card2)] px-[13px] text-[13.5px] text-[var(--tx)] outline-none focus:border-[var(--acc)] focus:shadow-[0_0_0_3px_var(--accbg)]",
        className,
      )}
      {...props}
    />
  );
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1.5 block text-[12.5px] text-[var(--tx2)]", className)}
      {...props}
    />
  );
}

export { Input, Label };
