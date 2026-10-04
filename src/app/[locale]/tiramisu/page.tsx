import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import TiramisuWizard from "@/components/tiramisu/TiramisuWizard";
import type { TiramisuUi } from "@/components/tiramisu/ui-context";
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
  const ui = (await getMessages({ locale })).tiramisuUi as TiramisuUi;
  return <TiramisuWizard locale={locale} ui={ui} />;
}
