import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9px] text-[13.5px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[var(--acc)] text-[#06121f] hover:bg-[var(--acc2)]",
        outline:
          "border border-[var(--bd)] bg-transparent text-[var(--tx)] font-medium hover:border-[var(--acc)] hover:text-[var(--acc2)]",
        ghost:
          "border border-[var(--bd)] bg-transparent text-[var(--tx2)] hover:text-[var(--tx)] hover:border-[var(--acc)] hover:bg-[var(--accbg)]",
        icon: "size-9 rounded-[9px] border border-[var(--bd)] bg-transparent text-[var(--tx2)] hover:text-[var(--tx)] hover:border-[var(--acc)] hover:bg-[var(--accbg)]",
        iconSm: "size-7 rounded-[7px] border border-[var(--bd)] bg-transparent text-[var(--tx2)] hover:text-[var(--tx)] hover:border-[var(--acc)] hover:bg-[var(--accbg)]",
      },
      size: {
        default: "h-[42px] px-[18px]",
        sm: "h-9 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { Button, buttonVariants };
