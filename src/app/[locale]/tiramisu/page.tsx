import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import TiramisuWizard from "@/components/tiramisu/TiramisuWizard";
import type { TiramisuUi } from "@/components/tiramisu/ui-context";
import { UniversePage } from "@/components/universe/UniversePage";
import { UniverseCrossSell } from "@/components/universe/UniverseCrossSell";
import { UniverseIdle } from "@/components/universe/UniverseIdle";
import { UNIVERSES, type Universe } from "@/components/universe/model";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "tiramisuUi" });
  return pageMetadata({ locale, path: "/tiramisu", title: t("meta_title"), description: t("meta_desc") });
}

export default async function TiramisuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  // Strings are passed as a plain object: the wizard needs no client intl
  // provider (no use-intl runtime on this route).
  const [messages, tu] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: "universe" }),
  ]);
  const ui = messages.tiramisuUi as TiramisuUi;
  const labels = Object.fromEntries(UNIVERSES.map((u) => [u, tu(`short.${u}`)])) as Record<Universe, string>;

  return (
    <UniversePage>
      <div>
        <TiramisuWizard
          locale={locale}
          ui={ui}
          universe={{
            labels,
            label: tu("switcher_label"),
            crossSell: <UniverseCrossSell current="tiramisu" tone="flat" className="text-start" />,
          }}
        />
        <UniverseIdle />
      </div>
    </UniversePage>
  );
}
