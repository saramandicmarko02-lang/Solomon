"use client";

import {
  LayoutDashboard,
  Server,
  IdCard,
  Folder,
  ScrollText,
  Cpu,
  Lock,
  Settings,
  PanelLeft,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SECTIONS,
  PAGES,
  getSectionForPage,
  type PageId,
  type SectionKey,
} from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { useStatus } from "@/lib/hooks/useStatus";

const ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  server: Server,
  "id-card": IdCard,
  folder: Folder,
  "scroll-text": ScrollText,
  cpu: Cpu,
  lock: Lock,
  settings: Settings,
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}

interface AppShellProps {
  activePage: PageId;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
}

export function AppShell({
  activePage,
  sidebarExpanded,
  onToggleSidebar,
  onNavigate,
  children,
}: AppShellProps) {
  const { data: status } = useStatus();
  const activeSection = getSectionForPage(activePage);
  const pageMeta = PAGES[activePage];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg)] text-[var(--tx)]">
      <aside className="flex shrink-0 border-r border-[var(--bd)] bg-[var(--side)]">
        <div className="flex w-[68px] shrink-0 flex-col items-center gap-1.5 border-r border-[var(--bd)] py-3">
          <span className="mb-2 flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#2160a8] to-[#012a5c] shadow-[0_2px_10px_rgba(1,56,118,0.5)]">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M7 12a5 5 0 1 1 5 5 5 5 0 1 0 5-5 5 5 0 1 1-5-5 5 5 0 1 0-5 5Z" />
            </svg>
          </span>
          {SECTIONS.map((section) => {
            const isActive = section.key === activeSection.key;
            return (
              <button
                key={section.key}
                type="button"
                title={section.label}
                onClick={() => onNavigate(section.pages[0])}
                className={cn(
                  "relative flex size-[46px] cursor-pointer items-center justify-center rounded-xl border-none transition-colors",
                  isActive
                    ? "bg-[var(--accbg)] text-[var(--acc2)]"
                    : "bg-transparent text-[var(--tx2)] hover:bg-white/[0.04] hover:text-[var(--tx)]",
                )}
              >
                {isActive ? (
                  <span className="absolute -left-[13px] top-3 bottom-3 w-[3px] rounded-r-[3px] bg-[var(--acc2)]" />
                ) : null}
                <NavIcon name={section.icon} className="size-5" />
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            type="button"
            title="Prikaži/sakrij panel"
            onClick={onToggleSidebar}
            className="flex size-[46px] cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-[var(--tx2)] hover:text-[var(--tx)]"
          >
            <PanelLeft className="size-[18px]" />
          </button>
        </div>

        {sidebarExpanded ? (
          <div className="flex w-[214px] shrink-0 flex-col">
            <div className="flex h-16 shrink-0 flex-col justify-center border-b border-[var(--bd)] px-[18px]">
              <div className="text-[15.5px] font-bold leading-tight tracking-tight">
                <span className="text-[var(--tx)]">Solo</span>
                <span className="text-[var(--acc2)]">mon</span>
              </div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--tx3)]">
                Halcom B2B Agent
              </div>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3.5">
              <div className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--tx3)]">
                {activeSection.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {activeSection.pages.map((pageId) => {
                  const page = PAGES[pageId];
                  const isActive = pageId === activePage;
                  return (
                    <button
                      key={pageId}
                      type="button"
                      onClick={() => onNavigate(pageId)}
                      className={cn(
                        "relative flex w-full cursor-pointer items-center gap-2.5 rounded-[9px] border-none px-2.5 py-2 text-left transition-colors",
                        isActive
                          ? "bg-[var(--accbg)] font-semibold text-[var(--acc2)]"
                          : "bg-transparent font-medium text-[var(--tx2)] hover:bg-white/[0.04] hover:text-[var(--tx)]",
                      )}
                    >
                      {isActive ? (
                        <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-[3px] bg-[var(--acc2)]" />
                      ) : null}
                      <NavIcon name={page.icon} className="size-[17px] shrink-0" />
                      <span className="flex min-w-0 flex-1 flex-col gap-px">
                        <span className="truncate text-[13px] leading-tight">{page.label}</span>
                        <span className="truncate text-[10.5px] font-normal text-[var(--tx3)]">
                          {page.sub}
                        </span>
                      </span>
                      {page.showDot && !isActive ? (
                        <span className="size-[7px] shrink-0 rounded-full bg-[var(--amb)]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="shrink-0 border-t border-[var(--bd)] p-3">
              <div className="flex items-center gap-2.5 rounded-[11px] border border-[var(--bd)] bg-[var(--card2)] px-3 py-2.5">
                <span className="relative size-2 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-[var(--grn)]" />
                  <span className="absolute -inset-[3px] animate-pulse-dot rounded-full bg-[var(--grn)] opacity-30" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold">
                    {status?.connected ? "WebSocket povezan" : status?.enrolled ? "WebSocket offline" : "Nije registrovan"}
                  </div>
                  <div className="text-[11px] text-[var(--tx3)]">
                    v{status?.solomonVersion ?? "—"}
                    {status?.connected ? "" : status?.lastError ? ` · ${status.lastError}` : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3.5 border-b border-[var(--bd)] bg-[rgba(10,19,34,0.7)] px-6 backdrop-blur-md">
          <Button variant="icon" onClick={onToggleSidebar} className="border-transparent">
            <PanelLeft className="size-[18px]" />
          </Button>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-[0.04em] text-[var(--tx3)]">
              SOLOMON · ADMIN
            </div>
            <div className="text-[17px] font-bold leading-tight tracking-tight">
              {pageMeta.label}
            </div>
          </div>
          <div className="flex-1" />
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
              status?.connected
                ? "bg-[var(--grnbg)] text-[var(--grn)]"
                : "bg-[var(--redbg)] text-[var(--red)]",
            )}
          >
            <NavIcon name="server" className="size-3.5" />
            {status?.connected ? "Agent online" : status?.enrolled ? "Agent offline" : "Nije registrovan"}
          </div>
        </header>
        <main className="scrollbar-thin flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
