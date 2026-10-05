import { getTranslations } from "next-intl/server";
import { EcrinSurface } from "@/components/ui/EcrinSurface";
import type { Locale } from "@/lib/db-types";
import { LEAD_TIME_DAYS } from "@/lib/business";
import { Button } from "@/components/ui/Button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/*
  How to order (B §7 steps band, on the écrin). A real sequence, so it is
  numbered. `id="commander"` is the header's /#commander target.
  No invented facts: the lead-time line renders only once the owner has
  confirmed LEAD_TIME_DAYS in src/lib/business.ts.
*/

export async function Steps({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home.steps" });
  const steps = [t("s1"), t("s2"), t("s3")];

  return (
    <EcrinSurface as="section" id="commander" aria-labelledby="steps-title" className="scroll-mt-0 py-16 desk:py-24">
      <div className="wrap">
        <h2 id="steps-title" className="type-h2 mb-8 text-sucre desk:mb-12">
          {t("title")}
        </h2>
        <ol className="grid gap-6 desk:grid-cols-3 desk:gap-10">
          {steps.map((text, i) => (
            <li key={i} className="grid grid-cols-[52px_minmax(0,1fr)] items-start gap-3 desk:grid-cols-1 desk:gap-4">
              <span aria-hidden="true" className="font-display text-[36px] leading-none text-cuivre desk:text-[52px]">
                {i + 1}
              </span>
              <p className="pt-1 text-[17px] leading-[1.45] text-sucre/90 [&:lang(ar)]:leading-[1.8] desk:max-w-[30ch] desk:pt-0">
                {text}
              </p>
            </li>
          ))}
        </ol>
        {LEAD_TIME_DAYS !== null && (
          <p className="mt-8 font-medium text-dragee">{t("lead_time", { days: LEAD_TIME_DAYS })}</p>
        )}
        <Button href={buildWhatsAppUrl({ locale, kind: "gate" })} icon="whatsapp" className="mt-10 w-full desk:w-auto">
          {t("cta")}
        </Button>
      </div>
    </EcrinSurface>
  );
}
