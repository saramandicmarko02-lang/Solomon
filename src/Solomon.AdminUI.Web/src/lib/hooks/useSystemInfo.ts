"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSystemInfo } from "@/lib/api/system";
import type { SystemInfoData } from "@/lib/api/types";

export function useSystemInfo(refreshIntervalMs = 15000) {
  const [data, setData] = useState<SystemInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const info = await fetchSystemInfo();
      setData(info);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri učitavanju sistema.");
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
