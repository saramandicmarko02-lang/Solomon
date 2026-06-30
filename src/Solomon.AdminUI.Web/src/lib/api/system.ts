import { fetchJson } from "./client";
import type { SystemInfoData } from "./types";

interface SystemApiResponse {
  hostname: string;
  machineGuid: string | null;
  osVersion: string;
  architecture: string;
  dotnetVersion: string;
  localIp: string | null;
  solomonVersion: string;
  serviceUptimeSeconds: number;
  serviceUptime: string;
  processId: number;
  workingSetMb: number;
  adminPort: number;
  installedAt: string | null;
}

export async function fetchSystemInfo(): Promise<SystemInfoData> {
  const data = await fetchJson<SystemApiResponse>("/api/system");
  return {
    resources: {
      cpuPercent: 0,
      cpuCores: 0,
      ramPercent: 0,
      ramUsedGb: 0,
      ramTotalGb: 0,
      serviceUptime: data.serviceUptime,
      activeThreads: 0,
    },
    machine: [
      { key: "Hostname", value: data.hostname },
      { key: "Machine GUID", value: data.machineGuid ?? "—" },
      { key: "OS verzija", value: data.osVersion },
      { key: "Arhitektura", value: data.architecture },
      { key: "Lokalna IP", value: data.localIp ?? "—" },
    ],
    runtime: [
      { key: ".NET runtime", value: data.dotnetVersion },
      { key: "Solomon verzija", value: data.solomonVersion },
      { key: "Admin port", value: `127.0.0.1:${data.adminPort}` },
      { key: "PID servisa", value: String(data.processId) },
      { key: "Memorija servisa", value: `${data.workingSetMb} MB` },
      { key: "Instaliran", value: data.installedAt ?? "—" },
    ],
  };
}
