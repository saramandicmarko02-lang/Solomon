export type PaymentTraffic = "domestic" | "foreign";

export const PAYMENT_TRAFFIC_LABELS: Record<PaymentTraffic, string> = {
  domestic: "Domaći platni promet",
  foreign: "Devizni platni promet",
};

export const FILE_PREFIX_DEFAULTS: Record<PaymentTraffic, string> = {
  domestic: "NA_",
  foreign: "NT_",
};

export function defaultFilePrefix(traffic: PaymentTraffic): string {
  return FILE_PREFIX_DEFAULTS[traffic];
}

export function isDefaultFilePrefix(traffic: PaymentTraffic, prefix: string): boolean {
  return prefix.trim() === FILE_PREFIX_DEFAULTS[traffic];
}
