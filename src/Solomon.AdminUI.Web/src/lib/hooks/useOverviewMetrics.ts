"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchOverviewMetrics } from "@/lib/api/overview";
import type { OverviewMetrics } from "@/lib/api/types";

export function useOverviewMetrics(refreshIntervalMs = 5000) {
  const [data, setData] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const metrics = await fetchOverviewMetrics();
      setData(metrics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri učitavanju.");
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
