import Image from "next/image";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import type { Cake, Locale } from "@/lib/db-types";
import { cakeRef } from "@/lib/cake-ref";
import { pipingFor, pipingStyle } from "@/lib/piping";
import { cn } from "@/lib/utils";

/*
  Cake card (B §7 + DESIGN.md amendments 2–4).
  U-mat photo on the cake's tint → title (owner's DB title) in the display
  face, in the cake's piping colour → one meta line → ref code.
  The whole card is ONE link. No hover lift, no shadow.

  <CakeCard cake={cake} locale={locale} />
  <CakeCard cake={cake} locale={locale} transitionName />   // card → plate VT
*/

export interface CakeCardProps {
  cake: Pick<Cake, "id" | "slug" | "images" | "category" | "categoryLabel" | "translations">;
  locale: Locale;
  /** Defaults to /galerie/<slug>. */
  href?: string;
  /** Meta line under the title. Defaults to the category label. */
  meta?: string;
  /** Heading level for the title (default h3). */
  as?: "h2" | "h3" | "h4";
  /** Default: 2 cols phone, 4 cols ≥900 (max ~290px). */
  sizes?: string;
  /** Eager-load (first row above the fold only). Never `priority`. */
  eager?: boolean;
  /**
   * View Transition name for the U-mat (card → detail plate morph).
   * `true` uses cakeTransitionName(slug). Names must be unique on a page:
   * don't set it on a card whose cake appears twice.
   */
  transitionName?: boolean | string;
  className?: string;
}

/** Same name on the card's mat and on the detail page's plate. */
export const cakeTransitionName = (slug: string) => `cake-${slug.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

export function CakeCard({
  cake,
  locale,
  href,
  meta,
  as: Heading = "h3",
  sizes = "(min-width: 1240px) 290px, (min-width: 900px) 23vw, 46vw",
  eager,
  transitionName,
  className,
}: CakeCardProps) {
  const title = (cake.translations[locale]?.title || cake.translations.fr.title).trim();
  const ref = cakeRef(cake.id);
  const piping = pipingFor(cake);
  const metaLine = meta ?? cake.categoryLabel?.[locale] ?? cake.categoryLabel?.fr;
  const vt =
    transitionName === true ? cakeTransitionName(cake.slug) : transitionName || undefined;
  const src = cake.images[0];

  return (
    <Link
      href={href ?? `/galerie/${cake.slug}`}
      className={cn("group block rounded-[18px] no-underline", className)}
      style={pipingStyle(piping)}
    >
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-tin bg-tint"
        style={vt ? { viewTransitionName: vt } : undefined}
      >
        {src && (
          <Image
            src={src}
            alt=""
            fill
            sizes={sizes}
            loading={eager ? "eager" : "lazy"}
            className="photo-grade object-cover object-[50%_35%]"
          />
        )}
      </div>
      <Heading className="type-card mt-3 text-piping">{title}</Heading>
      {metaLine && <p className="type-meta mt-1 text-ink-soft">{metaLine}</p>}
      <p className="mt-0.5 text-xs font-medium text-ink-muted">
        <bdi className="ltr">{ref}</bdi>
      </p>
    </Link>
  );
}
