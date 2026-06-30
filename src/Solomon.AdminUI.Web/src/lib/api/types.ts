export type PaymentTraffic = "domestic" | "foreign";

export interface AgentStatus {
  enrolled: boolean;
  agentId: string | null;
  connected: boolean;
  lastSuccessfulHeartbeat: string | null;
  lastConnectionAttempt: string | null;
  lastError: string | null;
  serverBaseUrl: string;
  inputFolderPath: string;
  adminPort: number;
  heartbeatIntervalSeconds: number;
  enrollmentPath: string;
  paymentTraffic: PaymentTraffic;
  filePrefix: string;
  solomonVersion?: string;
  hostname?: string;
}

export interface ActivityEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface SettingsUpdateRequest {
  serverBaseUrl?: string;
  inputFolderPath?: string;
  adminPort?: number;
  heartbeatIntervalSeconds?: number;
  enrollmentPath?: string;
  paymentTraffic?: string;
  filePrefix?: string;
}

export interface ApiSuccessResponse {
  success: boolean;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
}

export interface EnrollRequest {
  enrollmentCode: string;
  serverBaseUrl?: string;
}

export interface ConnectionUptimeMetrics {
  connected: boolean;
  statusLabel: string;
  uptimePercent24h: number;
  connectedDurationSeconds: number;
  disconnectedDurationSeconds: number;
  lastStatusChangeSecondsAgo: number;
  lastStatusLabel: string;
}

export interface AgentIdentityMetrics {
  agentId: string;
  agentIdShort: string;
  hostname: string;
  solomonVersion: string;
  enrolled: boolean;
  enrollmentLabel: string;
  serverUrl: string;
}

export interface HeartbeatSample {
  timestamp: string;
  latencyMs: number;
  success: boolean;
}

export interface HeartbeatHistoryMetrics {
  intervalSeconds: number;
  averageLatencyMs: number;
  samples: HeartbeatSample[];
  lastError: string | null;
  lastErrorTime: string | null;
}

export interface HealthCheckResult {
  id: string;
  label: string;
  passed: boolean;
}

export interface SystemHealthMetrics {
  diskLabel: string;
  diskUsedPercent: number;
  diskUsedGb: number;
  diskTotalGb: number;
  diskStatusLabel: string;
  diskStatusColor: "green" | "yellow" | "red";
  healthChecksPassed: number;
  healthChecksTotal: number;
  healthChecks: HealthCheckResult[];
  detectedFolderCount: number;
}

export interface JobDayStats {
  date: string;
  label: string;
  delivered: number;
  failed: number;
}

export interface JobActivityMetrics {
  delivered24h: number;
  failed24h: number;
  total24h: number;
  dailyStats: JobDayStats[];
}

export interface OverviewMetrics {
  refreshedSecondsAgo: number;
  connection: ConnectionUptimeMetrics;
  agent: AgentIdentityMetrics;
  heartbeat: HeartbeatHistoryMetrics;
  health: SystemHealthMetrics;
  jobs: JobActivityMetrics;
}

export interface FolderEntry {
  name: string;
  fileCount: number;
  lastModified: string;
}

export interface FoldersData {
  inputRootPath: string;
  subfolderCount: number;
  folders: FolderEntry[];
}

export interface SystemKvItem {
  key: string;
  value: string;
}

export interface SystemInfoData {
  resources: {
    cpuPercent: number;
    cpuCores: number;
    ramPercent: number;
    ramUsedGb: number;
    ramTotalGb: number;
    serviceUptime: string;
    activeThreads: number;
  };
  machine: SystemKvItem[];
  runtime: SystemKvItem[];
}
