export type PageId =
  | "overview"
  | "server"
  | "enrollment"
  | "folders"
  | "logs"
  | "system"
  | "settings";

export type SectionKey = "pregled" | "konekcija" | "podaci" | "sistem";

export interface NavSection {
  key: SectionKey;
  label: string;
  icon: string;
  pages: PageId[];
}

export interface PageMeta {
  label: string;
  sub: string;
  icon: string;
  showDot?: boolean;
}

export const SECTIONS: NavSection[] = [
  { key: "pregled", label: "Pregled", icon: "layout-dashboard", pages: ["overview"] },
  {
    key: "konekcija",
    label: "Konekcija",
    icon: "server",
    pages: ["server", "enrollment"],
  },
  {
    key: "podaci",
    label: "Podaci",
    icon: "folder",
    pages: ["folders", "logs"],
  },
  {
    key: "sistem",
    label: "Sistem",
    icon: "cpu",
    pages: ["system", "settings"],
  },
];

export const PAGES: Record<PageId, PageMeta> = {
  overview: { label: "Pregled", sub: "Sažetak stanja", icon: "layout-dashboard" },
  server: { label: "Server i konekcija", sub: "WebSocket veza", icon: "server" },
  enrollment: { label: "Registracija", sub: "Enrollment", icon: "id-card" },
  folders: { label: "Folderi", sub: "Subfolderi i datoteke", icon: "folder" },
  logs: {
    label: "Aktivnost / Logovi",
    sub: "Događaji agenta",
    icon: "scroll-text",
    showDot: true,
  },
  system: { label: "Sistem", sub: "Mašina i runtime", icon: "cpu" },
  settings: { label: "Podešavanja", sub: "Servis i intervali", icon: "settings" },
};

export function getSectionForPage(page: PageId): NavSection {
  return SECTIONS.find((s) => s.pages.includes(page)) ?? SECTIONS[0];
}
