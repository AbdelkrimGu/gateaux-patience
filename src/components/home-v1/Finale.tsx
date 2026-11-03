import { getTranslations } from "next-intl/server";
import SectionTone from "@/components/gp/SectionTone";
import Composer from "./Composer";
import RevealOnView from "./RevealOnView";

/**
 * 9 · The big finish (raspberry). The giant question rises line by line from
 * behind a clip (its one moment), then the WhatsApp composer with occasion
 * pills. Marked `data-final-cta` so the phone's sticky pill steps aside.
 */
export default async function Finale({ locale, occasions }: { locale: string; occasions: string[] }) {
  const t = await getTranslations({ locale, namespace: "home.finale" });
  const lines = [t("title_l1"), t("title_l2")];

  return (
    <SectionTone tone="raspberry" data-final-cta aria-labelledby="finale-title" className="py-20 md:py-32">
      <div className="gp-container">
        <RevealOnView rootMargin="0px 0px -20% 0px">
          <h2
            id="finale-title"
            aria-label={t("title")}
            className="font-display text-[clamp(3.4rem,1.2rem+9.4vw,10rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-gp-cream rtl:text-[clamp(3rem,1.1rem+8vw,8.5rem)] rtl:leading-[1.25] rtl:tracking-normal"
          >
            {lines.map((line, i) => (
              <span key={i} aria-hidden="true" className="block overflow-hidden pb-[0.06em]">
                <span className="gp-rise block" style={{ "--i": i } as React.CSSProperties}>
                  {line}
                </span>
              </span>
            ))}
          </h2>
        </RevealOnView>

        <div className="mt-10 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-8">
          <p className="max-w-[34ch] text-step-lead leading-[1.45] text-gp-cream/90 md:col-span-5 rtl:leading-[1.75]">
            {t("lead")}
          </p>
          <div className="md:col-span-7">
            <Composer occasions={occasions} />
          </div>
        </div>
      </div>
    </SectionTone>
  );
}
