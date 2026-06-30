"use client";

import { useSystemInfo } from "@/lib/hooks/useSystemInfo";
import { Card } from "@/components/ui/card";
import { KvRow } from "@/components/shared/kv-row";
import { Clock, Cpu } from "lucide-react";

export function SystemPage() {
  const { data, loading, error } = useSystemInfo();

  if (loading && !data) {
    return <Centered>Učitavanje sistema…</Centered>;
  }

  if (error || !data) {
    return <Centered>{error ?? "Podaci nisu dostupni."}</Centered>;
  }

  return (
    <div className="animate-fade-up max-w-[1180px] px-7 py-[26px] pb-12">
      <h1 className="m-0 text-2xl font-bold tracking-tight">Sistem</h1>
      <p className="mt-1.5 text-[13.5px] text-[var(--tx2)]">
        Trenutno opterećenje, identifikatori mašine i runtime okruženja.
      </p>

      <div className="mt-[22px] mb-[18px] grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Card className="flex flex-col justify-center px-5 py-[18px]">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs text-[var(--tx3)]">
            <Clock className="size-3.5" />
            Uptime servisa
          </div>
          <div className="font-mono text-[23px] font-bold tracking-tight">
            {data.resources.serviceUptime}
          </div>
        </Card>
        <Card className="flex flex-col justify-center px-5 py-[18px]">
          <div className="mb-1.5 text-xs text-[var(--tx3)]">Memorija servisa</div>
          <div className="font-mono text-[23px] font-bold tracking-tight">
            {data.runtime.find((r) => r.key === "Memorija servisa")?.value ?? "—"}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Card className="px-5 pb-2 pt-1">
          <div className="flex items-center gap-2 py-3.5">
            <Cpu className="size-4 text-[var(--tx2)]" />
            <span className="text-sm font-semibold">Mašina</span>
          </div>
          {data.machine.map((item) => (
            <KvRow key={item.key} label={item.key}>
              <span className="font-mono text-[12.5px] font-semibold">{item.value}</span>
            </KvRow>
          ))}
        </Card>
        <Card className="px-5 pb-2 pt-1">
          <div className="flex items-center gap-2 py-3.5">
            <Cpu className="size-4 text-[var(--tx2)]" />
            <span className="text-sm font-semibold">Runtime &amp; servis</span>
          </div>
          {data.runtime.map((item) => (
            <KvRow key={item.key} label={item.key}>
              <span className="font-mono text-[12.5px] font-semibold">{item.value}</span>
            </KvRow>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-64 items-center justify-center text-[var(--tx2)]">{children}</div>
  );
}
