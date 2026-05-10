import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CakeDetailClient from "@/components/gallery/CakeDetailClient";
import { CAKES, getCakeBySlug, type Locale } from "@/lib/cakes-data";

export async function generateStaticParams() {
  const locales = ["fr", "ar", "en"];
  return locales.flatMap((locale) =>
    CAKES.map((cake) => ({ locale, slug: cake.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const cake = getCakeBySlug(slug);
  if (!cake) return {};
  const t = cake.translations[locale as Locale] ?? cake.translations.fr;
  return {
    title: `${t.title} | Gateaux Patience`,
    description: t.description.slice(0, 160),
    openGraph: {
      images: [{ url: cake.images[0] }],
    },
  };
}

export default async function CakeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const cake = getCakeBySlug(slug);
  if (!cake) notFound();

  return (
    <main>
      <Header />
      <CakeDetailClient cake={cake} />
      <Footer />
    </main>
  );
}
