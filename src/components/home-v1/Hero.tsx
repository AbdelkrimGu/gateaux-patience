import { getTranslations } from "next-intl/server";
import DashedRingCta from "@/components/gp/DashedRingCta";
import HandNote from "@/components/gp/HandNote";
import SectionTone from "@/components/gp/SectionTone";
import Squiggle from "@/components/gp/Squiggle";
import { getOrderHref } from "@/lib/order-server";
import BowlCarousel, { type BowlCard } from "./BowlCarousel";

/**
 * 1 · Hero (cream). Badge, two-line headline with one raspberry word and a
 * raspberry full stop, handwritten "100 % artisanal", lead, the bowl carousel
 * of categories, then the WhatsApp CTA in its dashed ring. Everything but the
 * carousel's motion is server HTML: the H1 and CTA never wait for JS.
 */
export default async function Hero({
  locale,
  cards,
  startIndex,
}: {
  locale: string;
  cards: BowlCard[];
  startIndex: number;
}) {
  const t = await getTranslations({ locale, namespace: "home.hero" });
  const tf = await getTranslations({ locale, namespace: "frame" });
  const order = await getOrderHref(locale);

  return (
    <SectionTone
      tone="cream"
      aria-labelledby="hero-title"
      className="relative pb-14 pt-[calc(var(--gp-header-h)+1.5rem)] md:pb-16 md:pt-[calc(var(--gp-header-h)+2.25rem)]"
    >
      <div className="gp-container flex flex-col items-center text-center">
        <p className="inline-flex min-h-9 items-center rounded-full bg-gp-champagne px-4 py-1.5 text-[0.875rem] font-medium leading-snug text-gp-ink md:px-5 md:text-[0.9375rem]">
          {t("badge")}
        </p>

        <div className="relative mt-5 md:mt-6">
          <h1
            id="hero-title"
            className="mx-auto max-w-[15ch] font-display text-[clamp(2.45rem,1.35rem+3.1vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.042em] text-gp-ink [text-wrap:balance] md:max-w-[19ch] rtl:max-w-[14ch] rtl:text-[clamp(2.2rem,1.25rem+2.8vw,4rem)] rtl:leading-[1.22] rtl:tracking-normal md:rtl:max-w-[17ch]"
          >
            {t("title_before")} <span className="text-gp-raspberry">{t("title_accent")}</span>{" "}
            {t("title_after")}
            <span className="relative text-gp-raspberry">
              .
              {/* Desktop only (one note per phone viewport: the CTA's note wins there). */}
              <HandNote
                rotate={-8}
                size="md"
                decorative
                as="span"
                className="absolute bottom-[62%] start-full ms-4 hidden whitespace-nowrap tracking-normal lg:inline-flex"
              >
                {t("note")}
              </HandNote>
            </span>
          </h1>
        </div>

        <div className="relative mt-5 md:mt-6">
          <Squiggle
            variant="ticks"
            delay={500}
            strokeWidth={3}
            className="absolute -top-3 start-[-3.25rem] hidden h-9 w-9 text-gp-raspberry lg:block"
          />
          <p className="mx-auto max-w-[36ch] text-step-lead leading-[1.45] text-gp-ink/70 md:max-w-[44ch] rtl:leading-[1.7]">
            {t("lead")}
          </p>
        </div>
      </div>

      <div className="mt-7 md:mt-9">
        <BowlCarousel cards={cards} label={t("cards_label")} startIndex={startIndex} />
      </div>

      {/* Phones: note below the pill; tablets/desktop: note at the start side. */}
      <div data-hero-cta className="gp-container mt-8 flex justify-center md:mt-10">
        <DashedRingCta
          href={order()}
          srHint={tf("opens_whatsapp")}
          note={t("cta_note")}
          notePlacement="below"
          className="md:hidden"
        >
          {t("cta")}
        </DashedRingCta>
        <DashedRingCta
          href={order()}
          srHint={tf("opens_whatsapp")}
          note={t("cta_note")}
          notePlacement="start"
          className="hidden md:inline-flex"
        >
          {t("cta")}
        </DashedRingCta>
      </div>
    </SectionTone>
  );
}
