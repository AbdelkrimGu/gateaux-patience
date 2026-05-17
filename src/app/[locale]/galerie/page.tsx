import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GalleryClient from "@/components/gallery/GalleryClient";
import { getAllPublishedCakes } from "@/lib/cakes-data";
import { getCategories } from "@/lib/categories-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("gallery_title"),
    description: t("gallery_desc"),
  };
}

export default async function GalleriePage() {
  const [cakes, categories] = await Promise.all([getAllPublishedCakes(), getCategories()]);
  return (
    <main>
      <Header />
      <GalleryClient cakes={cakes} categories={categories} />
      <Footer />
    </main>
  );
}
