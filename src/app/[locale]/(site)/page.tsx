import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { IntentGate } from "@/components/home/IntentGate";
import { BrandStrip } from "@/components/home/BrandStrip";
import { Steps } from "@/components/home/Steps";
import { InstagramStrip } from "@/components/home/InstagramStrip";
import { StickyOrderBar } from "@/components/layout/StickyOrderBar";
import { UniversePage } from "@/components/universe/UniversePage";
import { byPhotoQuality } from "@/components/gallery/catalog";
import { getAllPublishedCakes } from "@/lib/cakes-data";
import type { Cake } from "@/lib/db-types";
import { CONTACT } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { ogImage, pageMetadata } from "@/lib/seo";

// ISR: served from cache, refreshed every 5 min and immediately when the
// admin saves a cake/category (src/lib/revalidate.ts).
export const revalidate = 300;

/**
 * The cakes card photo: a cake the owner flagged `hero` in the admin, else
 * the gallery's lead photo (same order as /galerie, so the card's photo
 * morphs into the very same photo, first in the grid).
 */
function gateCake(cakes: Cake[]): Cake | null {
  const withPhoto = cakes.filter((c) => !!c.images[0]);
  return withPhoto.find((c) => c.hero) ?? byPhotoQuality(withPhoto)[0] ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const [t, cakes] = await Promise.all([getTranslations({ locale, namespace: "home" }), getAllPublishedCakes()]);
  // meta_title already contains the brand (no "%s | Gateaux Patience" template).
  return pageMetadata({
    locale,
    path: "/",
    title: t("meta_title"),
    description: t("meta_desc", { year: CONTACT.founded }),
    image: ogImage(gateCake(cakes)?.images[0]),
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);

  const cake = gateCake(await getAllPublishedCakes());

  return (
    <UniversePage>
      <div>
        <IntentGate locale={locale} cakesPhoto={cake ? { src: cake.images[0], position: "50% 40%" } : undefined} />
        <BrandStrip locale={locale} />
        <Steps locale={locale} />
        <InstagramStrip locale={locale} />
        {/* The gate fills the first screen: the bar arrives once the visitor scrolls. */}
        <StickyOrderBar waHref={buildWhatsAppUrl({ locale, kind: "general" })} reveal="gate" />
      </div>
    </UniversePage>
  );
}
