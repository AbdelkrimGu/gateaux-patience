import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { StickyOrderBar } from "@/components/layout/StickyOrderBar";
import { SweetsHero } from "@/components/sweets/SweetsHero";
import { SweetsMenu } from "@/components/sweets/SweetsMenu";
import { SweetsCreations } from "@/components/sweets/SweetsCreations";
import { MakeItASet } from "@/components/sweets/MakeItASet";
import { SITE_URL } from "@/lib/constants";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { getSweetsCakes, SWEETS_HERO_IMAGE } from "@/lib/universes";
import { buildWhatsAppUrl, SWEET_TYPES } from "@/lib/whatsapp";

/*
  /douceurs: the sweets universe (07-intent-flow-spec §5).
    hero (real sweets photo on the lettered board) -> la carte des douceurs
    (one WhatsApp tile per sweet type) -> real sweets already made (hidden
    when none) -> "make it a set" (cake + tiramisu) -> sticky order bar.
  ISR like the other catalogue pages; the admin save routes revalidate it.
*/
export const revalidate = 300;

const PATH = "/douceurs";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "sweets" });
  return pageMetadata({
    locale,
    path: PATH,
    title: t("meta_title"),
    description: t("meta_desc"),
    image: {
      url: SWEETS_HERO_IMAGE.src,
      width: SWEETS_HERO_IMAGE.width,
      height: SWEETS_HERO_IMAGE.height,
      alt: t("hero.photo_alt"),
    },
  });
}

export default async function DouceursPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [t, cakes] = await Promise.all([getTranslations({ locale, namespace: "sweets" }), getSweetsCakes()]);

  // One sweets brief for the hero CTA, the "autre envie" link and the bar.
  const waHref = buildWhatsAppUrl({ locale, kind: "sweets", page: PATH });
  const url = absoluteUrl(locale, PATH);

  // CollectionPage + the menu (schema.org Menu/MenuItem: no offers needed,
  // and no prices are confirmed) + breadcrumb. The business entity itself
  // is in the locale layout (@id /#business).
  const jsonLd = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      url,
      name: t("meta_title"),
      description: t("meta_desc"),
      inLanguage: locale,
      isPartOf: { "@type": "WebSite", name: "Gateaux Patience", url: `${SITE_URL}/` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        contentUrl: `${SITE_URL}${SWEETS_HERO_IMAGE.src}`,
        caption: t("hero.photo_alt"),
      },
      mainEntity: {
        "@type": "Menu",
        "@id": `${url}#menu`,
        name: t("menu.title"),
        provider: { "@id": `${SITE_URL}/#business` },
        hasMenuItem: SWEET_TYPES.map((type) => ({
          "@type": "MenuItem",
          name: t(`menu.${type}.name`),
          description: t(`menu.${type}.text`),
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t("breadcrumb_home"), item: absoluteUrl(locale, "/") },
        { "@type": "ListItem", position: 2, name: t("menu.title"), item: url },
      ],
    },
  ]).replace(/</g, "\\u003c");

  return (
    <>
      <SweetsHero locale={locale} waHref={waHref} />
      <SweetsMenu locale={locale} otherHref={waHref} />
      <SweetsCreations locale={locale} cakes={cakes} />
      <MakeItASet locale={locale} />
      <StickyOrderBar waHref={waHref} reveal="scroll" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </>
  );
}
