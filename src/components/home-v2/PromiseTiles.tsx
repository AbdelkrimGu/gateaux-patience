import { getTranslations } from "next-intl/server";
import SectionTone from "@/components/gp/SectionTone";
import Print from "@/components/gp/Print";
import { cn } from "@/lib/utils";
import Reveal from "./Reveal";
import type { V2Photo } from "./data";

// raspberry · champagne · blush (raspberry/12 on cream) · ink with a gold hairline
const TILES = [
  { tone: "raspberry", cls: "bg-gp-raspberry", title: "", rot: 7 },
  { tone: "champagne", cls: "bg-gp-champagne", title: "", rot: -6 },
  { tone: "cream", cls: "hv2-blush", title: "", rot: 5 },
  { tone: "ink", cls: "bg-gp-ink ring-1 ring-inset ring-gp-gold/55", title: "text-gp-gold", rot: -7 },
] as const;
const KEYS = ["t1", "t2", "t3", "t4"] as const;
// Staggered like a hand of cards (desktop only).
const OFFSET = ["md:mt-0", "md:mt-[70px]", "md:mt-[25px]", "md:mt-[100px]"];

/**
 * 2 · Four promises on the ink evening: four tall tiles that rise in
 * sequence, each with a photo tucking itself into the top-end corner.
 * Phones: a horizontal snap row.
 */
export default async function PromiseTiles({ locale, photos }: { locale: string; photos: V2Photo[] }) {
  const t = await getTranslations({ locale, namespace: "home.promise" });
  return (
    <SectionTone tone="ink" aria-labelledby="promise-title" className="relative -mt-px pb-20 pt-6 md:pb-32 md:pt-10">
      <h2 id="promise-title" className="sr-only">
        {t("title_sr")}
      </h2>
      <Reveal
        as="ul"
        threshold={0.2}
        className="hv2-tiles gp-container flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 md:grid md:grid-cols-4 md:items-start md:gap-5 md:overflow-visible md:pb-0"
      >
        {TILES.map((tile, i) => {
          const photo = photos[i % Math.max(1, photos.length)];
          return (
            <li
              key={KEYS[i]}
              data-tone={tile.tone}
              style={{ "--i": i } as React.CSSProperties}
              className={cn(
                "hv2-tile relative flex min-h-[300px] w-[min(72vw,19rem)] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[30px] p-6 text-tone-fg md:min-h-[30rem] md:w-auto md:rounded-[34px] md:p-8",
                tile.cls,
                OFFSET[i]
              )}
            >
              {photo ? (
                <div className="hv2-tuck absolute -end-6 -top-5 w-[62%] md:-end-7 md:-top-6">
                  <Print
                    src={photo.src}
                    alt={photo.alt}
                    sizes="(min-width: 768px) 210px, 52vw"
                    rotate={tile.rot}
                    aspect="1 / 1"
                    objectPosition="50% 40%"
                  />
                </div>
              ) : null}
              <p
                className={cn(
                  "font-display text-[clamp(2.3rem,1.6rem+2vw,3.4rem)] font-semibold leading-[0.92] tracking-[-0.04em] rtl:leading-[1.2] rtl:tracking-normal",
                  tile.title
                )}
              >
                {t(`${KEYS[i]}_title`)}
              </p>
              <p className="mt-3 max-w-[26ch] text-step-body leading-snug text-tone-fg/80">{t(`${KEYS[i]}_text`)}</p>
            </li>
          );
        })}
      </Reveal>
    </SectionTone>
  );
}
