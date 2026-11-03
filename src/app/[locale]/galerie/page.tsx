import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteFrame from "@/components/gp/SiteFrame";
import GalleryClient from "@/components/gallery/GalleryClient";
import { getAllPublishedCakes } from "@/lib/cakes-data";
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
    title: t("gallery_title"),
    description: t("gallery_desc"),
    alternates: {
      canonical: locale === "fr" ? "/galerie" : `/${locale}/galerie`,
      languages: { fr: "/galerie", ar: "/ar/galerie", en: "/en/galerie" },
    },
  };
}

export default async function GalleriePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  noStore();
  const [cakes, categories] = await Promise.all([getAllPublishedCakes(), getCategories()]);
  return (
    <SiteFrame locale={locale}>
      <GalleryClient cakes={cakes} categories={categories} />
    </SiteFrame>
  );
}
