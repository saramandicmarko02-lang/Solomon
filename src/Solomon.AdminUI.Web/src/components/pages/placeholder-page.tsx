import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PAGES, type PageId } from "@/lib/navigation";

export function PlaceholderPage({ pageId }: { pageId: PageId }) {
  const page = PAGES[pageId];

  return (
    <div className="animate-fade-up px-7 py-[26px] pb-12">
      <h1 className="m-0 text-2xl font-bold tracking-tight">{page.label}</h1>
      <p className="mt-1.5 text-[13.5px] text-[var(--tx2)]">{page.sub}</p>
      <Card className="mt-6 max-w-xl p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle>U izradi</CardTitle>
          <CardDescription>
            Ova stranica će biti implementirana u Fazi 3+. Trenutno je fokus na Pregled
            stranici sa mock podacima.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
