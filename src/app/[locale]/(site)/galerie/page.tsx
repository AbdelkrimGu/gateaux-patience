import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { IntlIsland } from "@/components/layout/IntlIsland";
import { StickyOrderBar } from "@/components/layout/StickyOrderBar";
import GalleryClient from "@/components/gallery/GalleryClient";
import { getAllPublishedCakes } from "@/lib/cakes-data";
import { getCategories } from "@/lib/categories-data";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

// ISR (see src/lib/revalidate.ts). Keep this page static: read the ?c=
// filter on the client (useSearchParams inside <Suspense>), not from the
// `searchParams` prop, which would make every request dynamic.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: asLocale(locale), namespace: "meta" });
  return {
    title: t("gallery_title"),
    description: t("gallery_desc"),
    alternates: {
      canonical: locale === "fr" ? "/galerie" : `/${locale}/galerie`,
      languages: { fr: "/galerie", ar: "/ar/galerie", en: "/en/galerie" },
    },
  };
}

// WAVE 2b (gallery agent): GalleryClient is the OLD gallery. Replace it.
export default async function GalleriePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [cakes, categories] = await Promise.all([getAllPublishedCakes(), getCategories()]);
  return (
    <>
      <IntlIsland namespaces={[]}>
        <Suspense>
          <GalleryClient cakes={cakes} categories={categories} />
        </Suspense>
      </IntlIsland>
      <StickyOrderBar waHref={buildWhatsAppUrl({ locale, kind: "general", page: "/galerie" })} />
    </>
  );
}
