"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getStatus } from "@/lib/api/client";
import type { AgentStatus } from "@/lib/api/types";

export function useStatus(refreshIntervalMs = 5000) {
  const [data, setData] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const editingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (editingRef.current) return;
    try {
      const status = await getStatus();
      setData(status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri učitavanju statusa.");
    } finally {
      setLoading(false);
    }
  }, []);

  const forceRefresh = useCallback(async () => {
    try {
      const status = await getStatus();
      setData(status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri učitavanju statusa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void forceRefresh();
    const id = window.setInterval(() => void refresh(), refreshIntervalMs);
    return () => window.clearInterval(id);
  }, [refresh, forceRefresh, refreshIntervalMs]);

  return {
    data,
    loading,
    error,
    refresh: forceRefresh,
    setEditing: (editing: boolean) => {
      editingRef.current = editing;
    },
  };
}
