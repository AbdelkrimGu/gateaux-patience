import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import TiramisuWizard from "@/components/tiramisu/TiramisuWizard";
import SiteFrame from "@/components/gp/SiteFrame";

// The header's gallery menu reads the catalogue: refresh this static page hourly.
export const revalidate = 3600;

const META: Record<string, { title: string; desc: string }> = {
  fr: {
    title: "Tiramisu Personnalisé | Gateaux Patience",
    desc: "Commandez votre tiramisu : boîtes gourmandes ou personnalisées, écrivez votre message et visualisez le résultat en direct. Sidi Bel Abbès.",
  },
  ar: {
    title: "تيراميسو مخصّص | Gateaux Patience",
    desc: "اطلب تيراميسو الخاص بك: علب لذيذة أو مخصّصة، اكتب رسالتك وشاهد النتيجة مباشرة.",
  },
  en: {
    title: "Custom Tiramisu | Gateaux Patience",
    desc: "Order your tiramisu: gourmet or personalized boxes, write your message and preview it live. Sidi Bel Abbès.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] ?? META.fr;
  return {
    title: m.title,
    description: m.desc,
    alternates: {
      canonical: locale === "fr" ? "/tiramisu" : `/${locale}/tiramisu`,
      languages: { fr: "/tiramisu", ar: "/ar/tiramisu", en: "/en/tiramisu" },
    },
  };
}

export default async function TiramisuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // The wizard is an app-height surface: it sits under the (always frosted)
  // header and fills the rest of the screen; no sticky order pill here.
  return (
    <SiteFrame locale={locale} overlay={false} pill="off">
      <div className="pt-[calc(var(--gp-header-h)+env(safe-area-inset-top,0px))]">
        <TiramisuWizard />
      </div>
    </SiteFrame>
  );
}
