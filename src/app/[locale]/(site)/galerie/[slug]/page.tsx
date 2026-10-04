import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { IntlIsland } from "@/components/layout/IntlIsland";
import { StickyOrderBar } from "@/components/layout/StickyOrderBar";
import CakeDetailClient from "@/components/gallery/CakeDetailClient";
import { getAllPublishedSlugs, getCakeBySlug, getSimilarCakes } from "@/lib/cakes-data";
import { cakeRef } from "@/lib/cake-ref";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

// ISR: every published cake is prerendered at build (× 3 locales from the
// [locale] layout); new slugs render on first visit, then stay cached.
export const revalidate = 300;

export async function generateStaticParams() {
  return getAllPublishedSlugs();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  const cake = await getCakeBySlug(slug);
  if (!cake) return {};
  const t = cake.translations[locale] ?? cake.translations.fr;
  return {
    title: `${t.title.trim()} | Gateaux Patience`,
    description: t.description.slice(0, 160),
    alternates: {
      canonical: locale === "fr" ? `/galerie/${slug}` : `/${locale}/galerie/${slug}`,
      languages: { fr: `/galerie/${slug}`, ar: `/ar/galerie/${slug}`, en: `/en/galerie/${slug}` },
    },
    openGraph: cake.images[0] ? { images: [{ url: cake.images[0] }] } : undefined,
  };
}

// WAVE 2b (detail agent): CakeDetailClient is the OLD detail. Replace it.
export default async function CakeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  setRequestLocale(locale);
  const cake = await getCakeBySlug(slug);
  if (!cake) notFound();
  const similar = await getSimilarCakes(cake);
  const title = (cake.translations[locale]?.title || cake.translations.fr.title).trim();

  return (
    <>
      <IntlIsland namespaces={[]}>
        <CakeDetailClient cake={cake} similar={similar} />
      </IntlIsland>
      <StickyOrderBar
        waHref={buildWhatsAppUrl({
          locale,
          kind: "cake",
          cake: { title, ref: cakeRef(cake.id) },
          page: `/galerie/${slug}`,
        })}
      />
    </>
  );
}
