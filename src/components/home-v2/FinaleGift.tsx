import { getTranslations } from "next-intl/server";
import SectionTone from "@/components/gp/SectionTone";
import DashedRingCta from "@/components/gp/DashedRingCta";
import Eyebrow from "@/components/gp/Eyebrow";
import WhatsAppIcon from "@/components/gp/WhatsAppIcon";
import { getOrderHref } from "@/lib/order-server";
import Reveal from "./Reveal";

/** The satin bow at the ribbons' crossing (gold, champagne highlights). */
function Bow() {
  return (
    <svg viewBox="0 0 200 130" className="h-auto w-full" aria-hidden="true">
      <g className="hv2-bow-fill" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M94 66 L70 126 L84 118 L93 128 L104 70 Z" />
        <path d="M106 66 L130 126 L116 118 L107 128 L96 70 Z" />
        <path d="M100 60 C72 8 8 10 18 52 C26 90 76 82 100 60 Z" />
        <path d="M100 60 C128 8 192 10 182 52 C174 90 124 82 100 60 Z" />
      </g>
      <g className="hv2-bow-line" fill="none" strokeWidth="2" strokeLinecap="round">
        <path d="M100 60 C80 34 46 28 36 48" />
        <path d="M100 60 C120 34 154 28 164 48" />
        <path d="M30 56 C40 70 62 72 80 66" opacity=".55" />
        <path d="M170 56 C160 70 138 72 120 66" opacity=".55" />
      </g>
      <rect x="86" y="44" width="28" height="32" rx="10" className="hv2-bow-knot" strokeWidth="2.5" />
    </svg>
  );
}

/**
 * 10 · Finale, peak & end: on the ink page, a raspberry gift box tied with a
 * gold satin ribbon. As it enters, the bow lifts and the ribbons slide off
 * (≤ 1 s); inside: "Une date en tête ?", the WhatsApp CTA and occasion pills.
 * Server HTML / reduced motion = already unwrapped, fully readable.
 */
export default async function FinaleGift({
  locale,
  occasions,
}: {
  locale: string;
  occasions: { slug: string; label: string }[];
}) {
  const t = await getTranslations({ locale, namespace: "home.finale" });
  const tf = await getTranslations({ locale, namespace: "frame" });
  const order = await getOrderHref(locale);

  return (
    <SectionTone tone="ink" aria-labelledby="finale-title" data-final-cta className="pb-20 pt-6 md:pb-28 md:pt-10">
      <div className="gp-container">
        <Reveal
          data-tone="raspberry"
          threshold={0.35}
          className="hv2-gift relative isolate overflow-hidden rounded-[32px] bg-gp-raspberry text-gp-cream md:rounded-[44px]"
        >
          <div className="relative z-10 px-6 pb-14 pe-[19%] pt-20 sm:px-10 sm:pe-[30%] md:px-16 md:pb-20 md:pe-[30%] md:pt-24">
            <h2
              id="finale-title"
              className="max-w-[12ch]font-display text-[clamp(2.9rem,1.5rem+5.6vw,6.4rem)] font-semibold leading-[0.92] tracking-[-0.045em] rtl:leading-[1.25] rtl:tracking-normal"
            >
              {t("title")}
            </h2>
            <p className="mt-6 max-w-[40ch] text-step-lead leading-snug text-gp-cream/90">{t("lead")}</p>
            <DashedRingCta href={order()} srHint={tf("opens_whatsapp")} className="mt-10">
              {tf("order_full")}
            </DashedRingCta>
            <Eyebrow className="mt-12 text-gp-cream/80">{t("pills_label")}</Eyebrow>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {occasions.map((o) => (
                <li key={o.slug}>
                  <a
                    href={order({ occasion: o.label })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-semibold text-gp-cream ring-1 ring-inset ring-gp-cream/50 transition-colors duration-150 hover:bg-gp-cream/10"
                  >
                    <WhatsAppIcon className="h-4 w-4 shrink-0 opacity-80" />
                    {o.label}
                    <span className="sr-only"> ({tf("opens_whatsapp")})</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* The wrapping: decorative, never blocks clicks. */}
          <span aria-hidden="true" className="hv2-ribbon-v pointer-events-none absolute inset-y-0 start-[84%] z-20 w-9 sm:start-[72%] sm:w-12 md:w-16" />
          <span aria-hidden="true" className="hv2-ribbon-h pointer-events-none absolute inset-x-0 top-[40%] z-20 h-9 sm:h-11 md:h-14" />
          <div
            aria-hidden="true"
            className="hv2-bow pointer-events-none absolute start-[calc(84%+1.125rem)] top-[calc(40%+1.125rem)] z-30 w-[118px] -translate-x-1/2 -translate-y-1/2 sm:start-[calc(72%+1.5rem)] sm:top-[calc(40%+1.375rem)] sm:w-[160px] md:start-[calc(72%+2rem)] md:top-[calc(40%+1.75rem)] md:w-[220px] rtl:translate-x-1/2"
          >
            <Bow />
          </div>

          {/* Once untied, the bow is set aside in the corner (wide screens). */}
          <div
            aria-hidden="true"
            className="hv2-bow-rest pointer-events-none absolute bottom-[7%] end-[5%] z-0 hidden w-[180px] md:block lg:w-[210px]"
          >
            <Bow />
          </div>

          {/* The tag stays: it is the card on the gift. */}
          <div aria-hidden="true" className="hv2-tag pointer-events-none absolute end-[7%] top-0 z-30 flex flex-col items-center">
            <span className="block h-10 w-px bg-gp-cream/60 md:h-14" />
            <span className="-mt-1 rounded-[8px] bg-gp-cream px-3.5 py-1 font-note text-[1.4rem] font-bold leading-tight text-gp-raspberry shadow-gp-chip md:text-[1.75rem]">
              {t("for_you")}
            </span>
          </div>
        </Reveal>
      </div>
    </SectionTone>
  );
}
