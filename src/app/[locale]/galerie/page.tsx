import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GalleryClient from "@/components/gallery/GalleryClient";

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

export default function GalleriePage() {
  return (
    <main>
      <Header />
      <GalleryClient />
      <Footer />
    </main>
  );
}
