import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Eyebrow from "@/components/gp/Eyebrow";
import SectionTone from "@/components/gp/SectionTone";
import WhatsAppIcon from "@/components/gp/WhatsAppIcon";
import type { HomePhoto } from "@/lib/home-data";
import { getOrderHref } from "@/lib/order-server";
import { cn } from "@/lib/utils";

export interface Folder {
  slug: string;
  label: string;
  href: string;
  photos: HomePhoto[];
}

/** Folder colours in order: raspberry → champagne → blush → ink. */
const SKINS = [
  // On the raspberry folder the CTA goes ink, so it isn't a twin of the sticky pill.
  { tone: "raspberry", bg: "bg-gp-raspberry", cta: "bg-gp-ink text-gp-cream" },
  { tone: "champagne", bg: "bg-gp-champagne", cta: "bg-tone-cta-bg text-tone-cta-fg" },
  { tone: "cream", bg: "gp-blush", cta: "bg-tone-cta-bg text-tone-cta-fg" },
  { tone: "ink", bg: "bg-gp-ink", cta: "bg-tone-cta-bg text-tone-cta-fg" },
] as const;

/**
 * 4 · Occasions as party folders — the page's peak. Each occasion is a
 * coloured folder with a tab; folders are `position: sticky` one tab-height
 * apart, so they stack into a staircase of tabs as you scroll (pure CSS).
 * The folder being covered settles back slightly (scroll-driven CSS, no JS).
 */
export default async function PartyFolders({ locale, folders }: { locale: string; folders: Folder[] }) {
  const t = await getTranslations({ locale, namespace: "home.occasions" });
  const tf = await getTranslations({ locale, namespace: "frame" });
  const order = await getOrderHref(locale);
  const n = folders.length;

  return (
    <SectionTone tone="cream" aria-labelledby="occasions-title" className="pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="gp-container">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h2
          id="occasions-title"
          className="mt-3 font-display text-step-head font-semibold leading-[1] tracking-[-0.035em] rtl:leading-[1.25] rtl:tracking-normal"
        >
          {t("title")}
        </h2>

        <ol
          className="gp-folders mt-10 md:mt-12"
          style={
            {
              "--n": n,
              timelineScope: folders.map((_, i) => `--gpf${i}`).join(", "),
            } as React.CSSProperties
          }
        >
          {folders.map((f, i) => {
            const skin = SKINS[i % SKINS.length];
            const coveredBy = i < n - 1 ? `--gpf${i + 1}` : undefined;
            return (
              <li
                key={f.slug}
                data-covered-by={coveredBy}
                className="gp-folder relative pt-9 md:pt-11"
                style={
                  {
                    "--i": i,
                    zIndex: i + 1,
                    viewTimelineName: `--gpf${i}`,
                  } as React.CSSProperties
                }
              >
                <article
                  data-tone={skin.tone}
                  aria-labelledby={`folder-${f.slug}`}
                  className={cn(
                    "gp-folder-body relative rounded-[24px] rounded-ss-none text-tone-fg shadow-[0_-14px_30px_-22px_rgb(var(--gp-ink)/0.45)] md:rounded-[32px] md:rounded-ss-none",
                    skin.bg
                  )}
                  style={coveredBy ? ({ animationTimeline: coveredBy } as React.CSSProperties) : undefined}
                >
                  {/* Tab: same colour as its folder, slanted at the end side. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "gp-folder-tab absolute bottom-[calc(100%-1px)] start-0 flex h-9 max-w-[80%] items-center truncate rounded-t-[14px] pe-9 ps-5 text-[0.875rem] font-semibold md:h-11 md:rounded-t-[16px] md:pe-11 md:ps-7 md:text-[0.9375rem]",
                      skin.bg
                    )}
                  >
                    <span className="truncate">{f.label}</span>
                  </span>

                  {/* Fades out while the next folder covers it: only its edge and tab stay. */}
                  <div
                    className="gp-folder-content p-5 md:p-8"
                    style={coveredBy ? ({ animationTimeline: coveredBy } as React.CSSProperties) : undefined}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                      <h3
                        id={`folder-${f.slug}`}
                        className="font-display text-[clamp(1.75rem,1.1rem+2.3vw,3.25rem)] font-semibold leading-[1] tracking-[-0.035em] rtl:leading-[1.3] rtl:tracking-normal"
                      >
                        {f.label}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <a
                          href={order({ occasion: f.label })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "group inline-flex min-h-12 items-center gap-2.5 rounded-full px-6 text-[0.9375rem] font-semibold shadow-gp-chip transition-transform duration-150 ease-gp hover:-translate-y-px active:scale-[0.97]",
                            skin.cta
                          )}
                        >
                          <WhatsAppIcon className="h-[18px] w-[18px] shrink-0" />
                          {t("cta")}
                          <span className="sr-only">
                            {" "}
                            ({f.label}, {tf("opens_whatsapp")})
                          </span>
                        </a>
                        <Link
                          href={f.href}
                          className="group inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] font-medium underline decoration-tone-fg/35 underline-offset-[6px] transition-colors hover:decoration-tone-fg"
                        >
                          {t("see")}
                          <span className="sr-only"> ({f.label})</span>
                          <ArrowRight
                            aria-hidden="true"
                            className="h-4 w-4 transition-transform duration-200 ease-gp group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                          />
                        </Link>
                      </div>
                    </div>

                    <ul className="-mx-5 mt-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:mt-7 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
                      {f.photos.map((p) => (
                        <li key={p.src} className="w-[62%] shrink-0 snap-start md:w-auto">
                          <Link href={`/galerie/${p.cakeSlug}`} className="group block rounded-[18px]">
                            <span className="relative block aspect-[4/3] overflow-hidden rounded-[16px] bg-tone-fg/10 md:rounded-[18px]">
                              <Image
                                src={p.src}
                                alt=""
                                fill
                                sizes="(min-width: 1320px) 400px, (min-width: 768px) 30vw, 62vw"
                                className="object-cover transition-transform duration-500 ease-gp group-hover:scale-[1.03]"
                              />
                            </span>
                            <span className="mt-2 block truncate text-step-small leading-tight opacity-85">
                              {p.alt}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Darkens slightly while the next folder slides over (see home-v1.css). */}
                  <span
                    aria-hidden="true"
                    className="gp-folder-shade pointer-events-none absolute inset-0 rounded-[inherit] bg-gp-ink/10 opacity-0"
                    style={coveredBy ? ({ animationTimeline: coveredBy } as React.CSSProperties) : undefined}
                  />
                </article>
              </li>
            );
          })}
          {/* Rest stop: the whole stack stays pinned a beat before it scrolls away. */}
          <li aria-hidden="true" className="gp-folder-rest" />
        </ol>
      </div>
    </SectionTone>
  );
}
