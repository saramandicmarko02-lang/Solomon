import type {
  ActivityEntry,
  AgentStatus,
  ApiErrorResponse,
  ApiSuccessResponse,
  EnrollRequest,
  SettingsUpdateRequest,
} from "./types";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = (await res.json().catch(() => ({}))) as T & ApiErrorResponse;
  if (!res.ok) {
    throw new ApiError(data.error || res.statusText || "Request failed");
  }
  return data;
}

export function getStatus(): Promise<AgentStatus> {
  return fetchJson<AgentStatus>("/api/status");
}

export function getActivity(): Promise<ActivityEntry[]> {
  return fetchJson<ActivityEntry[]>("/api/activity");
}

export function postSettings(body: SettingsUpdateRequest): Promise<ApiSuccessResponse> {
  return fetchJson<ApiSuccessResponse>("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function postEnroll(body: EnrollRequest): Promise<ApiSuccessResponse> {
  return fetchJson<ApiSuccessResponse>("/api/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function postUnenroll(): Promise<ApiSuccessResponse> {
  return fetchJson<ApiSuccessResponse>("/api/unenroll", { method: "POST" });
}

export { fetchOverviewMetrics } from "./overview";
export { fetchFolders } from "./folders";
export { fetchSystemInfo } from "./system";
