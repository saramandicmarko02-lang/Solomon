"use client";

import { useState } from "react";
import type { AgentIdentityMetrics } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardHeaderRow, KvRow } from "@/components/shared/kv-row";
import { CheckCircle2, Copy, IdCard } from "lucide-react";

interface AgentIdentityCardProps {
  data: AgentIdentityMetrics;
}

export function AgentIdentityCard({ data }: AgentIdentityCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(data.agentId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Card className="p-5">
      <CardHeaderRow icon={<IdCard className="size-4" />} title="Agent" />
      <div className="mt-1.5">
        <KvRow label="Agent ID">
          <span className="flex items-center justify-end gap-2">
            <span className="font-mono text-[13px] font-semibold">{data.agentIdShort}</span>
            <Button variant="iconSm" onClick={() => void copyId()} aria-label="Kopiraj Agent ID">
              {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </span>
        </KvRow>
        <KvRow label="Hostname">
          <span className="font-mono text-[13px] font-semibold">{data.hostname}</span>
        </KvRow>
        <KvRow label="Solomon verzija">
          <span className="font-mono text-[13px] font-semibold">{data.solomonVersion}</span>
        </KvRow>
        <KvRow label="Status registracije">
          <span
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
            style={{ color: data.enrolled ? "var(--grn)" : "var(--red)" }}
          >
            <CheckCircle2 className="size-4" />
            {data.enrollmentLabel}
          </span>
        </KvRow>
        <KvRow label="Server">
          <span className="font-mono text-[12.5px] text-[var(--tx2)]">{data.serverUrl}</span>
        </KvRow>
      </div>
    </Card>
  );
}
