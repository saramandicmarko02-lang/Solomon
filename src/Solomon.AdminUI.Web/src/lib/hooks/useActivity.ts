"use client";

import { useCallback, useEffect, useState } from "react";
import { getActivity } from "@/lib/api/client";
import type { ActivityEntry } from "@/lib/api/types";

export function useActivity(refreshIntervalMs = 5000) {
  const [data, setData] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const items = await getActivity();
      setData(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri učitavanju aktivnosti.");
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
