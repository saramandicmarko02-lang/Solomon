import { fetchJson } from "./client";
import type { FoldersData } from "./types";

interface FoldersApiResponse {
  inputRootPath: string;
  subfolderCount: number;
  folders: Array<{
    name: string;
    fileCount: number;
    lastModified: string | null;
  }>;
}

export async function fetchFolders(): Promise<FoldersData> {
  const data = await fetchJson<FoldersApiResponse>("/api/folders");
  return {
    inputRootPath: data.inputRootPath,
    subfolderCount: data.subfolderCount,
    folders: data.folders.map((f) => ({
      name: f.name,
      fileCount: f.fileCount,
      lastModified: f.lastModified
        ? new Date(f.lastModified).toLocaleTimeString("sr-RS", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
    })),
  };
}
