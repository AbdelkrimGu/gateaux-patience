import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import StatsBar from "@/components/home/StatsBar";
import FeaturedCakes from "@/components/home/FeaturedCakes";
import CategoriesSection from "@/components/home/CategoriesSection";
import AboutSection from "@/components/home/AboutSection";
import HowToOrderSection from "@/components/home/HowToOrderSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import SocialCTASection from "@/components/home/SocialCTASection";
import { getFeaturedCakes } from "@/lib/cakes-data";

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
  const featured = await getFeaturedCakes(6);
  return (
    <main>
      <Header />
      <HeroSection />
      <StatsBar />
      <FeaturedCakes cakes={featured} />
      <CategoriesSection />
      <AboutSection />
      <HowToOrderSection />
      <TestimonialsSection />
      <SocialCTASection />
      <Footer />
    </main>
  );
}
