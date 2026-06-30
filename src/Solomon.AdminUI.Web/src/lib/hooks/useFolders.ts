"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchFolders } from "@/lib/api/folders";
import type { FoldersData } from "@/lib/api/types";

export function useFolders(refreshIntervalMs = 10000) {
  const [data, setData] = useState<FoldersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const folders = await fetchFolders();
      setData(folders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri učitavanju foldera.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), refreshIntervalMs);
    return () => window.clearInterval(id);
  }, [refresh, refreshIntervalMs]);

  return { data, loading, error, refresh };
}
