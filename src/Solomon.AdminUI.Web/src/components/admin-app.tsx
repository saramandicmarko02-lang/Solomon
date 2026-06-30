"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { OverviewPage } from "@/components/pages/overview-page";
import { ServerPage } from "@/components/pages/server-page";
import { EnrollmentPage } from "@/components/pages/enrollment-page";
import { FoldersPage } from "@/components/pages/folders-page";
import { LogsPage } from "@/components/pages/logs-page";
import { SystemPage } from "@/components/pages/system-page";
import { SettingsPage } from "@/components/pages/settings-page";
import type { PageId } from "@/lib/navigation";

export function AdminApp() {
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  function renderPage() {
    switch (activePage) {
      case "overview":
        return <OverviewPage onNavigate={setActivePage} />;
      case "server":
        return <ServerPage />;
      case "enrollment":
        return <EnrollmentPage />;
      case "folders":
        return <FoldersPage />;
      case "logs":
        return <LogsPage />;
      case "system":
        return <SystemPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <OverviewPage onNavigate={setActivePage} />;
    }
  }

  return (
    <AppShell
      activePage={activePage}
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={() => setSidebarExpanded((v) => !v)}
      onNavigate={setActivePage}
    >
      {renderPage()}
    </AppShell>
  );
}
