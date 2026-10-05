import { useLocale, useTranslations } from "next-intl";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { Wordmark } from "@/components/ui/Wordmark";
import { HeaderSwitcher } from "@/components/universe/UniverseBar";
import { UNIVERSES, UNIVERSE_HREF, type Universe } from "@/components/universe/model";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { PHONE_E164, PHONE_LOCAL } from "@/lib/constants";
import { HeaderNav } from "./HeaderNav";

/*
  Site header (B §7): crown + wordmark, FR / ع / EN circles, 44px hamburger
  on mobile. Static (not sticky): on phones the universe strip
  (UniverseBar, rendered right below by SiteChrome) sticks instead, and the
  StickyOrderBar carries the order action.
  Desktop: the universe switcher [Gâteaux | Douceurs | Tiramisu] sits next
  to the wordmark, then "Mariages", "Comment commander" and the
  "Commander" pill.
  Named for view transitions (gp-site-header): it stays put while pages
  slide under it (universe/transitions-css.ts).
*/

export function Header() {
  const t = useTranslations("common");
  const tu = useTranslations("universe");
  const locale = useLocale();

  const universeLabels = Object.fromEntries(UNIVERSES.map((u) => [u, tu(`short.${u}`)])) as Record<Universe, string>;

  // Mobile menu: the three universes first, then the rest.
  const items = [
    { href: "/galerie", label: tu("title.cakes") },
    { href: "/douceurs", label: tu("title.sweets") },
    { href: "/tiramisu", label: tu("title.tiramisu") },
    { href: "/galerie?c=wedding", label: t("nav.weddings") },
    { href: "/#commander", label: t("nav.how_to_order") },
  ];
  // Desktop: the switcher carries the universes; these follow it.
  const deskItems = [
    { href: "/galerie?c=wedding", label: t("nav.weddings"), wide: true },
    { href: "/#commander", label: t("nav.how_to_order") },
  ];

  // "Commander" (desktop pill + mobile menu): the message follows the
  // universe the visitor is in (HeaderNav picks by pathname); outside the
  // universes, the neutral sentence.
  const orderHrefs: Record<Universe | "gate", string> = {
    gate: buildWhatsAppUrl({ locale, kind: "gate" }),
    cakes: buildWhatsAppUrl({ locale, kind: "general", page: UNIVERSE_HREF.cakes }),
    sweets: buildWhatsAppUrl({ locale, kind: "sweets", page: UNIVERSE_HREF.sweets }),
    tiramisu: buildWhatsAppUrl({ locale, kind: "tiramisu", page: UNIVERSE_HREF.tiramisu }),
  };

  return (
    <header className="wrap flex h-(--header-h) items-center gap-3 [view-transition-name:gp-site-header]">
      <Link href="/" aria-label={t("nav.home_aria")} className="me-auto rounded-lg no-underline desk:me-0">
        <Wordmark layout="stacked" className="desk:hidden" />
        <Wordmark layout="inline" className="hidden desk:inline-flex" />
      </Link>
      <HeaderSwitcher labels={universeLabels} label={tu("switcher_label")} className="hidden desk:ms-8 desk:block" />
      <HeaderNav
        items={items}
        deskItems={deskItems}
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
        orderHrefs={orderHrefs}
        callLabel={t("order.call_aria", { phone: PHONE_LOCAL })}
        phoneHref={`tel:${PHONE_E164}`}
        phoneDisplay={PHONE_LOCAL}
      />
    </header>
  );
}
