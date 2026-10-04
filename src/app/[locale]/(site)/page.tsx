import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { HomeHero } from "@/components/home/HomeHero";
import { MakeBands } from "@/components/home/MakeBands";
import { Creations } from "@/components/home/Creations";
import { Steps } from "@/components/home/Steps";
import { InstagramStrip } from "@/components/home/InstagramStrip";
import { HomeStickyBar } from "@/components/home/LiveOrder";
import { pickHomeCakes } from "@/components/home/pick-cakes";
import { getAllPublishedCakes } from "@/lib/cakes-data";
import { CONTACT, PHONE_LOCAL } from "@/lib/constants";

// ISR: served from cache, refreshed every 5 min and immediately when the
// admin saves a cake/category (src/lib/revalidate.ts).
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    // meta_title already contains the brand: skip the "%s | Gateaux Patience" template.
    title: { absolute: t("meta_title") },
    description: t("meta_desc", { year: CONTACT.founded }),
    alternates: {
      canonical: locale === "fr" ? "/" : `/${locale}`,
      languages: { fr: "/", ar: "/ar", en: "/en" },
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);

  const [cakes, common] = await Promise.all([getAllPublishedCakes(), getTranslations({ locale, namespace: "common" })]);
  const { hero, featured, cakesPhoto, weddingPhoto } = pickHomeCakes(cakes);

  return (
    <>
      <HomeHero locale={locale} cake={hero} />
      <MakeBands locale={locale} cakesPhoto={cakesPhoto} weddingPhoto={weddingPhoto} />
      <Creations locale={locale} cakes={featured} />
      <Steps locale={locale} />
      <InstagramStrip locale={locale} />
      <HomeStickyBar
        locale={locale}
        label={common("order.cta")}
        navLabel={common("order.bar_label")}
        callLabel={common("order.call_aria", { phone: PHONE_LOCAL })}
      />
    </>
  );
}
