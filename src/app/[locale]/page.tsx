import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedCakes from "@/components/home/FeaturedCakes";
import CategoriesSection from "@/components/home/CategoriesSection";
import { getCategoryImageGroups, getFeaturedCakes } from "@/lib/cakes-data";
import { getCategories } from "@/lib/categories-data";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("home_title"),
    description: t("home_desc"),
    alternates: {
      canonical: locale === "fr" ? "/" : `/${locale}`,
      languages: {
        fr: "/",
        ar: "/ar",
        en: "/en",
      },
    },
  };
}

export default async function HomePage() {
  noStore();
  const [featured, categories, floatingGroups] = await Promise.all([
    getFeaturedCakes(6),
    getCategories(),
    getCategoryImageGroups(6, 4),
  ]);
  return (
    <main>
      <Header />
      <HeroSection floatingGroups={floatingGroups} />
      <FeaturedCakes cakes={featured} />
      <CategoriesSection categories={categories} />
      <Footer />
    </main>
  );
}
