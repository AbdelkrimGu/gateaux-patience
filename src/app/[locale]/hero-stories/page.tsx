import { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StoriesHero from "@/components/home/StoriesHero";
import FeaturedCakes from "@/components/home/FeaturedCakes";
import CategoriesSection from "@/components/home/CategoriesSection";
import AboutSection from "@/components/home/AboutSection";
import HowToOrderSection from "@/components/home/HowToOrderSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import SocialCTASection from "@/components/home/SocialCTASection";
import { getCategoryImageGroups, getFeaturedCakes } from "@/lib/cakes-data";
import { getCategories } from "@/lib/categories-data";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hero preview — Stories",
  robots: { index: false, follow: false },
};

export default async function HeroStoriesPreviewPage() {
  noStore();
  const [featured, categories, occasions] = await Promise.all([
    getFeaturedCakes(6),
    getCategories(),
    getCategoryImageGroups(4, 1),
  ]);
  return (
    <main>
      <Header />
      <StoriesHero stories={featured} occasions={occasions} />
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
