import { setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { SiteChrome } from "@/components/layout/SiteChrome";

// Public pages with the site chrome. /tiramisu lives outside this group: the
// wizard is full-screen and has no header/footer.
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(asLocale(locale));
  return <SiteChrome>{children}</SiteChrome>;
}
