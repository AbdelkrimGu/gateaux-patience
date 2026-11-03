import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { unstable_noStore as noStore } from "next/cache";
import SiteFrame from "@/components/gp/SiteFrame";
import { getHomeData } from "@/lib/home-data";
import { buildSoireeData } from "@/components/home-v2/data";
import HeroSoiree from "@/components/home-v2/HeroSoiree";
import PromiseTiles from "@/components/home-v2/PromiseTiles";
import MenuFan from "@/components/home-v2/MenuFan";
import OccasionsSection from "@/components/home-v2/OccasionsSection";
import HowSection from "@/components/home-v2/HowSection";
import HouseStamp from "@/components/home-v2/HouseStamp";
import TicketSection from "@/components/home-v2/TicketSection";
import FaqWords from "@/components/home-v2/FaqWords";
import FollowStories from "@/components/home-v2/FollowStories";
import FinaleGift from "@/components/home-v2/FinaleGift";
// Section styles of this line-up only (kept out of the global stylesheet).
import "@/components/home-v2/home-v2.css";

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

/**
 * Home, line-up 2 "Soirée royale" (dark, logo-like; peak & end = the gift):
 * ink hero → ink promises → cream fan → champagne occasions → raspberry steps
 * → cream house → ink ticket → cream questions → champagne stories → ink gift
 * → giant gold wordmark footer.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  noStore();
  const th = await getTranslations({ locale, namespace: "home" });
  // Home-only display labels (database labels untouched): a natural Arabic
  // name for "grossesse", short card labels for the hero.
  const data = buildSoireeData(await getHomeData(locale), {
    label: (slug) => (th.has(`category_display.${slug}`) ? th(`category_display.${slug}`) : undefined),
    short: (slug) => (th.has(`category_short.${slug}`) ? th(`category_short.${slug}`) : undefined),
  });
  const occasions = data?.occasionLabels ?? [];

  return (
    // Every section paints its own tone; an ink <main> keeps the seam with the
    // ink footer free of a cream half-pixel line at fractional heights.
    <SiteFrame locale={locale} footer="wordmark" footerCta={false} mainClassName="bg-gp-ink">

      <HeroSoiree locale={locale} cards={data?.hero ?? []} />
      {data ? (
        <>
          <PromiseTiles locale={locale} photos={data.tiles} />
          <MenuFan locale={locale} categories={data.fan} defaultSlug={data.fanDefault} />
          <OccasionsSection locale={locale} occasions={data.occasions} />
          <HowSection locale={locale} slider={data.slider} />
          <HouseStamp locale={locale} photo={data.signature} />
        </>
      ) : null}
      <TicketSection locale={locale} occasions={occasions} />
      <FaqWords locale={locale} />
      {data ? <FollowStories locale={locale} stories={data.stories} grid={data.grid} /> : null}
      <FinaleGift locale={locale} occasions={occasions} />
    </SiteFrame>
  );
}
