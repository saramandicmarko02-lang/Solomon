import { Card } from "@/components/ui/card";
import { PRIVACY_DOES_NOT_SEND, PRIVACY_SENDS } from "@/lib/content/privacy";
import { CheckCircle2, Eye, Lock, XCircle } from "lucide-react";

export function PrivacyPage() {
  return (
    <div className="animate-fade-up max-w-[900px] px-7 py-[26px] pb-12">
      <h1 className="m-0 text-2xl font-bold tracking-tight">Privatnost</h1>
      <p className="mt-1.5 text-[13.5px] text-[var(--tx2)]">
        Šta Solomon agent šalje cloud serveru, a šta ostaje isključivo lokalno.
      </p>

      <div className="mt-[22px] grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Eye className="size-4 text-[var(--acc2)]" />
            <span className="text-sm font-semibold">Šta se šalje</span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {PRIVACY_SENDS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] text-[var(--tx2)]">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--grn)]" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="size-4 text-[var(--tx2)]" />
            <span className="text-sm font-semibold">Šta se ne šalje</span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {PRIVACY_DOES_NOT_SEND.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] text-[var(--tx2)]">
                <XCircle className="mt-0.5 size-4 shrink-0 text-[var(--red)]" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-[18px] p-5">
        <p className="m-0 text-[13px] leading-relaxed text-[var(--tx2)]">
          Admin panel je dostupan samo na <strong className="text-[var(--tx)]">127.0.0.1</strong>.
          Enrollment token se čuva enkriptovano pomoću Windows DPAPI. Solomon ne otvara inbound
          mrežne portove ka spoljašnjem svetu.
        </p>
      </Card>
    </div>
  );
}
