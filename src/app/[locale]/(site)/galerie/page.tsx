import { ViewTransition } from "react";
import { preload } from "react-dom";
import type { Metadata } from "next";
import { getImageProps } from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { localizePath } from "@/i18n/paths";
import { StickyOrderBar } from "@/components/layout/StickyOrderBar";
import { Button } from "@/components/ui/Button";
import { CakeCard } from "@/components/ui/CakeCard";
import { GalleryFilter, GalleryFilterStyles, type FilterChip } from "@/components/gallery/GalleryFilter";
import { CardTransitionScope } from "@/components/gallery/CardTransitionScope";
import { byPhotoQuality, categoriesWithCakes } from "@/components/gallery/catalog";
// Cakes universe only: sweets-universe categories are listed on /douceurs.
import { getCakesCategories, getCakesUniverseCakes } from "@/lib/universes";
import { assertUniqueRefs } from "@/lib/cake-ref";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { ogImage, pageMetadata } from "@/lib/seo";
import { ViewTransitionStyles } from "@/components/gallery/ViewTransitionStyles";

// ISR (see src/lib/revalidate.ts). Keep this page static: the ?c= filter is
// read on the client (GalleryFilter), never from `searchParams` here.
export const revalidate = 300;

/** Same as CakeCard's default `sizes` (2 cols phone, 4 cols ≥900). */
const CARD_SIZES = "(min-width: 1240px) 290px, (min-width: 900px) 23vw, 46vw";
/** Above the fold: one row on desktop, two rows on a phone. */
const EAGER = 4;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const [t, cakes] = await Promise.all([getTranslations({ locale, namespace: "gallery" }), getCakesUniverseCakes()]);
  return pageMetadata({
    locale,
    path: "/galerie",
    title: t("meta_title"),
    description: t("meta_desc"),
    image: ogImage(cakes[0]?.images[0]),
  });
}

export default async function GalleriePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [catalogue, categories, t, tc] = await Promise.all([
    getCakesUniverseCakes(),
    getCakesCategories(),
    getTranslations({ locale, namespace: "gallery" }),
    getTranslations({ locale, namespace: "common" }),
  ]);
  assertUniqueRefs(catalogue);
  // Clean, crisp photos open the grid (and every filter); see catalog.ts.
  const cakes = byPhotoQuality(catalogue);

  const cats = categoriesWithCakes(cakes, categories, locale);
  const listed = new Set(cats.map((c) => c.slug));
  const chips: FilterChip[] = [
    {
      slug: null,
      label: t("all"),
      count: cakes.length,
      href: localizePath(locale, "/galerie"),
    },
    ...cats.map((c) => ({
      slug: c.slug,
      label: c.label,
      count: c.count,
      dot: c.dot,
      href: localizePath(locale, `/galerie?c=${encodeURIComponent(c.slug)}`),
    })),
  ];
  const countLabels: Record<string, string> = {
    "": t("count", { count: cakes.length }),
  };
  for (const c of cats) countLabels[c.slug] = t("count", { count: c.count });

  const generalHref = buildWhatsAppUrl({ locale, kind: "general", page: "/galerie" });
  // Wedding brief for ?c=wedding ("un gâteau de mariage / fiançailles").
  const weddingHref = buildWhatsAppUrl({ locale, kind: "general", category: "wedding", page: "/galerie?c=wedding" });

  // The first card is the phone LCP: preload it at high priority with the
  // exact srcset CakeCard's next/image will request (CakeCard itself only
  // offers `eager`).
  const first = cakes[0]?.images[0];
  if (first) {
    const { props } = getImageProps({
      src: first,
      alt: "",
      fill: true,
      sizes: CARD_SIZES,
    });
    preload(props.src, {
      as: "image",
      imageSrcSet: props.srcSet,
      imageSizes: props.sizes,
      fetchPriority: "high",
    });
  }

  return (
    <ViewTransition default="none">
      <ViewTransitionStyles />
      <div className="pb-16 desk:pb-24">
        <header className="wrap pt-6 pb-2 desk:pt-14 desk:pb-4">
          <h1 className="type-h1">{t("title")}</h1>
          <p className="type-lead mt-3 desk:mt-5">{t("intro")}</p>
        </header>

        <GalleryFilter
          chips={chips}
          filterLabel={t("filter_label")}
          countLabels={countLabels}
          wedding={
            listed.has("wedding")
              ? {
                  title: t("wedding_title"),
                  text: t("wedding_text"),
                  cta: t("wedding_cta"),
                  opensWhatsApp: tc("order.opens_whatsapp"),
                  href: weddingHref,
                }
              : undefined
          }
          bars={{
            general: <StickyOrderBar waHref={generalHref} />,
            wedding: <StickyOrderBar waHref={weddingHref} />,
          }}
        >
          <CardTransitionScope>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-6 desk:grid-cols-4 desk:gap-x-6 desk:gap-y-10">
              {cakes.map((cake, i) => (
                <li
                  key={cake.id}
                  data-cat={listed.has(cake.category) ? cake.category : "_"}
                  // Below the fold: skip layout/paint until near the viewport.
                  className={i < EAGER ? undefined : "[contain-intrinsic-size:auto_420px] [content-visibility:auto]"}
                >
                  <CakeCard cake={cake} locale={locale} as="h2" eager={i < EAGER} sizes={CARD_SIZES} />
                </li>
              ))}
            </ul>
          </CardTransitionScope>
        </GalleryFilter>
        <GalleryFilterStyles slugs={[...listed]} />

        <section aria-labelledby="gallery-closing" className="wrap mt-16 desk:mt-24">
          <div className="grid gap-6 rounded-band bg-dragee px-6 py-8 desk:grid-cols-[1.2fr_1fr] desk:items-end desk:gap-12 desk:px-12 desk:py-12">
            <div>
              <h2 id="gallery-closing" className="type-h2 max-w-[16ch]">
                {t("closing_title")}
              </h2>
              <p className="type-lead mt-3">{t("closing_text")}</p>
            </div>
            <div className="flex flex-col items-start gap-4">
              <Button
                href={generalHref}
                icon="whatsapp"
                className="w-full desk:w-auto"
              >
                {t("closing_cta")}
              </Button>
              <p className="type-meta mt-2 text-ink-soft">{t("closing_tiramisu_text")}</p>
              <Button href="/tiramisu" variant="ghost" size="sm" className="-mt-1">
                {t("closing_tiramisu")}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </ViewTransition>
  );
}
