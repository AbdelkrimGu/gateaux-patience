import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteFrame from "@/components/gp/SiteFrame";
import HeroSection from "@/components/home/HeroSection";
import FeaturedCakes from "@/components/home/FeaturedCakes";
import CategoriesSection from "@/components/home/CategoriesSection";
import AboutSection from "@/components/home/AboutSection";
import HowToOrderSection from "@/components/home/HowToOrderSection";
import SocialCTASection from "@/components/home/SocialCTASection";
import {
  getCategoryImageGroups,
  getFeaturedCakes,
  getHeroCakes,
} from "@/lib/cakes-data";
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
    // home_title already contains the brand — skip the "%s | Gateaux Patience" template.
    title: { absolute: t("home_title") },
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

// The current sections stay until the two line-ups (refine/creme-velours,
// refine/soiree-royale) replace them; the new frame (header, curtain footer,
// sticky pill) is already in place.
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  noStore();
  const [hero, featured, categories, floatingGroups] = await Promise.all([
    getHeroCakes(5),
    getFeaturedCakes(6),
    getCategories(),
    getCategoryImageGroups(24, 4),
  ]);
  return (
    <SiteFrame locale={locale} footer="curtain">
      <HeroSection hero={hero} floatingGroups={floatingGroups} />
      <FeaturedCakes cakes={featured} />
      <CategoriesSection categories={categories} />
      <AboutSection />
      <HowToOrderSection />
      <SocialCTASection />
    </SiteFrame>
  );
}
