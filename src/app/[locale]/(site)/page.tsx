import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { IntlIsland } from "@/components/layout/IntlIsland";
import { StickyOrderBar } from "@/components/layout/StickyOrderBar";
import HeroSection from "@/components/home/HeroSection";
import FeaturedCakes from "@/components/home/FeaturedCakes";
import CategoriesSection from "@/components/home/CategoriesSection";
import AboutSection from "@/components/home/AboutSection";
import HowToOrderSection from "@/components/home/HowToOrderSection";
import SocialCTASection from "@/components/home/SocialCTASection";
import { getCategoryImageGroups, getFeaturedCakes, getHeroCakes } from "@/lib/cakes-data";
import { getCategories } from "@/lib/categories-data";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

// ISR: served from cache, refreshed every 5 min and immediately when the
// admin saves a cake/category (src/lib/revalidate.ts).
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: asLocale(locale), namespace: "meta" });

  return {
    // home_title already contains the brand — skip the "%s | Gateaux Patience" template.
    title: { absolute: t("home_title") },
    description: t("home_desc"),
    alternates: {
      canonical: locale === "fr" ? "/" : `/${locale}`,
      languages: { fr: "/", ar: "/ar", en: "/en" },
    },
  };
}

// WAVE 2b (home agent): the sections below are the OLD home, kept only so the
// page renders until the new one lands. Replace them wholesale.
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [hero, featured, categories, floatingGroups] = await Promise.all([
    getHeroCakes(5),
    getFeaturedCakes(6),
    getCategories(),
    getCategoryImageGroups(24, 4),
  ]);
  return (
    <>
      <IntlIsland namespaces={["hero", "featured", "categories", "about", "how_to_order", "social"]}>
        <HeroSection hero={hero} floatingGroups={floatingGroups} />
        <FeaturedCakes cakes={featured} />
        <CategoriesSection categories={categories} />
        <AboutSection />
        <div id="commander">
          <HowToOrderSection />
        </div>
        <SocialCTASection />
      </IntlIsland>
      <StickyOrderBar waHref={buildWhatsAppUrl({ locale, kind: "general", page: "/" })} reveal="scroll" />
    </>
  );
}
