import { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import SiteFrame from "@/components/gp/SiteFrame";
import CakeDetailClient from "@/components/gallery/CakeDetailClient";
import { getCakeBySlug, getSimilarCakes, type Locale } from "@/lib/cakes-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const cake = await getCakeBySlug(slug);
  if (!cake) return {};
  const t = cake.translations[locale as Locale] ?? cake.translations.fr;
  return {
    title: `${t.title} | Gateaux Patience`,
    description: t.description.slice(0, 160),
    alternates: {
      canonical: locale === "fr" ? `/galerie/${slug}` : `/${locale}/galerie/${slug}`,
      languages: { fr: `/galerie/${slug}`, ar: `/ar/galerie/${slug}`, en: `/en/galerie/${slug}` },
    },
    openGraph: cake.images[0] ? { images: [{ url: cake.images[0] }] } : undefined,
  };
}

export default async function CakeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const cake = await getCakeBySlug(slug);
  if (!cake) notFound();
  const similar = await getSimilarCakes(cake);

  return (
    <SiteFrame locale={locale}>
      <CakeDetailClient cake={cake} similar={similar} />
    </SiteFrame>
  );
}
