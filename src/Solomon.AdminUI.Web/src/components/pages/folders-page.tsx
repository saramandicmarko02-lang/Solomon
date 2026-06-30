"use client";

import { useMemo } from "react";
import { useFolders } from "@/lib/hooks/useFolders";
import { formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Folder } from "lucide-react";

export function FoldersPage() {
  const { data, loading, error } = useFolders();

  const bars = useMemo(() => {
    if (!data?.folders.length) return [];
    const max = Math.max(...data.folders.map((f) => f.fileCount));
    return data.folders.map((f) => ({
      ...f,
      pct: max ? Math.round((f.fileCount / max) * 100) : 0,
    }));
  }, [data]);

  if (loading && !data) {
    return <Centered>Učitavanje foldera…</Centered>;
  }

  if (error || !data) {
    return <Centered>{error ?? "Podaci nisu dostupni."}</Centered>;
  }

  return (
    <div className="animate-fade-up px-7 py-[26px] pb-12">
      <h1 className="m-0 text-2xl font-bold tracking-tight">Folderi</h1>
      <p className="mt-1.5 text-[13.5px] text-[var(--tx2)]">
        Detektovani subfolderi i broj datoteka u svakom.
      </p>

      <Card className="mt-[22px] mb-[18px] flex items-center gap-3 px-[18px] py-4">
        <Folder className="size-[18px] text-[var(--acc2)]" />
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] text-[var(--tx3)]">Input folder</div>
          <div className="font-mono text-[13.5px] text-[var(--tx)]">{data.inputRootPath}</div>
        </div>
        <span className="rounded-full bg-[var(--accbg)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--acc2)]">
          {data.subfolderCount} subfoldera
        </span>
      </Card>

      <div className="grid grid-cols-1 items-start gap-[18px] xl:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_130px] gap-3.5 border-b border-[var(--bd)] px-[18px] py-3 text-[10.5px] font-bold tracking-[0.05em] text-[var(--tx3)]">
            <div>SUBFOLDER</div>
            <div className="text-right">DATOTEKE</div>
            <div>POSLEDNJA</div>
          </div>
          {data.folders.map((folder) => (
            <div
              key={folder.name}
              className="grid grid-cols-[1fr_100px_130px] gap-3.5 border-b border-[var(--bd2)] px-[18px] py-3 hover:bg-white/[0.025]"
            >
              <div className="flex items-center gap-2.5 text-[13.5px] font-medium">
                <Folder className="size-4 text-[var(--acc)]" />
                {folder.name}
              </div>
              <div className="text-right font-mono text-[13px] font-semibold">
                {formatNumber(folder.fileCount)}
              </div>
              <div className="font-mono text-xs text-[var(--tx3)]">{folder.lastModified}</div>
            </div>
          ))}
        </Card>

        <Card className="p-5">
          <div className="mb-3.5 text-[13.5px] font-semibold">Datoteke po folderu</div>
          <div className="flex flex-col gap-3">
            {bars.map((bar) => (
              <div key={bar.name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[var(--tx2)]">{bar.name}</span>
                  <span className="font-mono font-semibold">{bar.fileCount}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[rgba(148,163,184,0.1)]">
                  <div
                    className="h-full rounded-full bg-[var(--acc)]"
                    style={{ width: `${bar.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
