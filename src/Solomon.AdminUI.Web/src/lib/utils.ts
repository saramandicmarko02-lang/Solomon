import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("sr-RS").format(value);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export function formatRelativeSeconds(seconds: number): string {
  if (seconds < 60) return `pre ${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `pre ${m}m`;
  const h = Math.floor(m / 60);
  return `pre ${h}h ${m % 60}m`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("sr-RS");
  } catch {
    return value;
  }
}
