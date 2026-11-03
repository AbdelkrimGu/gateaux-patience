import { getTranslations } from "next-intl/server";
import SectionTone from "@/components/gp/SectionTone";
import DashedRingCta from "@/components/gp/DashedRingCta";
import HandNote from "@/components/gp/HandNote";
import { getOrderHref } from "@/lib/order-server";
import BowlCarousel from "./BowlCarousel";
import type { HeroCard } from "./data";

/**
 * 1 · Hero on cocoa-ink: the photos glow like the sequin cloth they were shot
 * on. Headline, lead and CTA are plain server HTML (LCP = the headline text);
 * the bowl carousel is the only island.
 */
export default async function HeroSoiree({ locale, cards }: { locale: string; cards: HeroCard[] }) {
  const t = await getTranslations({ locale, namespace: "home.hero" });
  const tf = await getTranslations({ locale, namespace: "frame" });
  const order = await getOrderHref(locale);

  return (
    <SectionTone tone="ink" aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <div className="gp-container relative pt-[calc(var(--gp-header-h)+env(safe-area-inset-top,0px)+1.75rem)] text-center md:pt-[calc(var(--gp-header-h)+3rem)]">
        <p className="mx-auto inline-flex min-h-9 items-center rounded-full bg-gp-champagne px-4 text-step-small font-medium text-gp-ink md:min-h-10 md:px-5">
          {t("badge")}
        </p>
        <div className="relative mx-auto mt-5 w-fit md:mt-7">
          <h1
            id="hero-title"
            className="mx-auto max-w-[12ch] text-balance font-display text-[clamp(2.75rem,1.5rem+4.6vw,5.6rem)] font-semibold leading-[0.95] tracking-[-0.045em] sm:max-w-[22ch] rtl:text-[clamp(2.4rem,1.4rem+4vw,4.9rem)] rtl:leading-[1.25] rtl:tracking-normal"
          >
            {t("title_before")} <span className="text-gp-gold">{t("title_accent")}</span>{" "}
            {t("title_after")}
            <span className="text-gp-raspberry">.</span>
          </h1>
          <HandNote
            size="md"
            rotate={-7}
            className="absolute end-full top-[2%] me-[-7.5rem] hidden text-gp-gold xl:inline-flex"
          >
            {t("note")}
          </HandNote>
        </div>
        <p className="mx-auto mt-5 max-w-[38ch] text-step-lead leading-snug text-gp-cream/75 md:mt-6">{t("lead")}</p>
      </div>

      <div className="relative mt-8 md:mt-9">
        <BowlCarousel
          label={t("cards_label")}
          cards={cards.map((c) => ({
            src: c.src,
            shortLabel: c.shortLabel,
            href: c.galleryHref,
            ariaLabel: t("card_aria", { label: c.label, cake: c.alt }),
          }))}
        />
      </div>

      <div className="gp-container flex flex-col items-center gap-4 pb-14 pt-6 md:flex-row md:justify-center md:gap-8 md:pb-20 md:pt-4">
        <DashedRingCta
          href={order()}
          srHint={tf("opens_whatsapp")}
          data-hero-cta
          className="md:order-2"
        >
          {t("cta")}
        </DashedRingCta>
        <HandNote size="sm" rotate={-4} className="text-gp-gold md:hidden" as="p">
          {t("cta_note")}
        </HandNote>
        <HandNote size="sm" rotate={-5} arrow="end" className="hidden text-gp-gold md:order-1 md:inline-flex" as="p">
          {t("cta_note")}
        </HandNote>
      </div>
    </SectionTone>
  );
}
