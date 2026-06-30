"use client";

import { useEffect, useState } from "react";

export function useFormFields<T extends Record<string, string | number>>(
  source: T | null | undefined,
  enabled = true,
) {
  const [fields, setFields] = useState<T | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!enabled || editing || !source) return;
    setFields(source);
  }, [source, editing, enabled]);

  function updateField<K extends keyof T>(key: K, value: T[K]) {
    setEditing(true);
    setFields((prev) => {
      if (prev) return { ...prev, [key]: value };
      return { [key]: value } as unknown as T;
    });
  }

  function resetFromSource() {
    if (source) {
      setFields(source);
    }
    setEditing(false);
  }

  function markSaved() {
    setEditing(false);
  }

  return {
    fields: fields ?? source ?? null,
    editing,
    setEditing,
    updateField,
    resetFromSource,
    markSaved,
  };
}
