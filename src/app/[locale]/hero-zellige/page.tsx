import { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ZelligeHero from "@/components/home/ZelligeHero";
import FeaturedCakes from "@/components/home/FeaturedCakes";
import CategoriesSection from "@/components/home/CategoriesSection";
import AboutSection from "@/components/home/AboutSection";
import HowToOrderSection from "@/components/home/HowToOrderSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import SocialCTASection from "@/components/home/SocialCTASection";
import { getFeaturedCakes } from "@/lib/cakes-data";
import { getCategories } from "@/lib/categories-data";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hero preview — Zellige",
  robots: { index: false, follow: false },
};

export default async function HeroZelligePreviewPage() {
  noStore();
  const [featured, categories] = await Promise.all([
    getFeaturedCakes(8),
    getCategories(),
  ]);
  return (
    <main>
      <Header />
      <ZelligeHero cakes={featured} />
      <FeaturedCakes cakes={featured} />
      <CategoriesSection categories={categories} />
      <AboutSection />
      <HowToOrderSection />
      <TestimonialsSection />
      <SocialCTASection />
      <Footer />
    </main>
  );
}
