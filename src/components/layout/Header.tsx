import { useLocale, useTranslations } from "next-intl";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { Wordmark } from "@/components/ui/Wordmark";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { PHONE_E164, PHONE_LOCAL } from "@/lib/constants";
import { HeaderNav } from "./HeaderNav";

/*
  Site header (B §7): crown + wordmark, desktop links + "Commander" pill,
  FR / ع / EN circles, 44px hamburger on mobile. Static (not sticky): on
  phones the StickyOrderBar carries the order action.
*/

export function Header({ orderHref }: { orderHref?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();

  const items = [
    { href: "/galerie", label: t("nav.creations") },
    { href: "/tiramisu", label: t("nav.tiramisu") },
    { href: "/galerie?c=wedding", label: t("nav.weddings") },
    { href: "/#commander", label: t("nav.how_to_order") },
  ];

  return (
    <header className="wrap flex h-(--header-h) items-center gap-3">
      <Link href="/" aria-label={t("nav.home_aria")} className="me-auto rounded-lg no-underline">
        <Wordmark layout="stacked" className="desk:hidden" />
        <Wordmark layout="inline" className="hidden desk:inline-flex" />
      </Link>
      <HeaderNav
        items={items}
        navLabel={t("nav.primary_label")}
        langLabel={t("lang.label")}
        langs={{
          fr: { short: t("lang.fr_short"), name: t("lang.fr_name") },
          ar: { short: t("lang.ar_short"), name: t("lang.ar_name") },
          en: { short: t("lang.en_short"), name: t("lang.en_name") },
        }}
        menuOpen={t("nav.menu_open")}
        menuClose={t("nav.menu_close")}
        menuTitle={t("nav.menu_title")}
        orderLabel={t("order.cta_short")}
        orderHref={orderHref ?? buildWhatsAppUrl({ locale, kind: "general" })}
        callLabel={t("order.call_aria", { phone: PHONE_LOCAL })}
        phoneHref={`tel:${PHONE_E164}`}
        phoneDisplay={PHONE_LOCAL}
      />
    </header>
  );
}
