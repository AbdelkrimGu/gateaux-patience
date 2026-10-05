import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { LetteredBoard } from "@/components/ui/LetteredBoard";
import type { Locale } from "@/lib/db-types";
import { SWEETS_HERO_IMAGE } from "@/lib/universes-core";

/*
  /douceurs hero (07 §5): H1, one-line promise, WhatsApp CTA, and a REAL
  sweets photo (Cake10: cakesicles spelling a name + graduation cake pops)
  on the lettered board. All server HTML; the photo is the phone LCP.
  Signature moment of the page: the board's ring is piped (LetteredBoard's
  CSS animation, reduced-motion aware). Same grid as the home hero.
*/

export async function SweetsHero({ locale, waHref }: { locale: Locale; waHref: string }) {
  const t = await getTranslations({ locale, namespace: "sweets.hero" });

  return (
    <section
      aria-labelledby="sweets-title"
      className="wrap grid grid-cols-1 gap-3 pt-2 pb-12 desk:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] desk:content-center desk:gap-x-14 desk:gap-y-6 desk:pt-6 desk:pb-20"
    >
      <h1
        id="sweets-title"
        className="type-h1 max-w-[12ch] [@media(max-width:899px)_and_(max-height:760px)]:text-[34px] desk:max-w-none desk:self-end desk:text-[clamp(56px,5.8vw,86px)]"
      >
        {t("title")}
      </h1>
      <p className="type-lead max-w-[38ch]">{t("lead")}</p>

      <figure data-gp-hero="sweets" className="m-0 mt-2 grid justify-items-center gap-3 desk:col-start-2 desk:row-span-3 desk:row-start-1 desk:mt-0 desk:self-center">
        <LetteredBoard
          lang={locale}
          message={t("ring")}
          image={{
            src: SWEETS_HERO_IMAGE.src,
            alt: t("photo_alt"),
            position: SWEETS_HERO_IMAGE.position,
            priority: true,
            sizes: "(min-width: 900px) 380px, (max-height: 760px) min(48vw, 250px), min(58vw, 300px)",
          }}
          className="w-[min(58vw,300px)] [@media(max-width:899px)_and_(max-height:760px)]:w-[min(48vw,250px)] desk:w-[min(100%,380px)]"
        />
        <figcaption className="type-meta -mt-3 max-w-[34ch] text-center text-ink-muted desk:-mt-1">{t("caption")}</figcaption>
      </figure>

      <div className="grid gap-2 desk:flex desk:items-center desk:gap-6">
        <Button href={waHref} icon="whatsapp" block className="desk:w-auto desk:shrink-0">
          {t("cta")}
        </Button>
        <p className="type-meta text-center text-ink-muted desk:max-w-[32ch] desk:text-start">
          {t("note")}{" "}
          <a
            href="#carte"
            className="font-semibold whitespace-nowrap text-ink underline decoration-framboise decoration-2 underline-offset-4"
          >
            {t("see_menu")}
          </a>
        </p>
      </div>
    </section>
  );
}
