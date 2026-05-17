import { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
    openGraph: cake.images[0] ? { images: [{ url: cake.images[0] }] } : undefined,
  };
}

export default async function CakeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const cake = await getCakeBySlug(slug);
  if (!cake) notFound();
  const similar = await getSimilarCakes(cake);

  return (
    <main>
      <Header />
      <CakeDetailClient cake={cake} similar={similar} />
      <Footer />
    </main>
  );
}
