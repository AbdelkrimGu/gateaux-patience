import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { EcrinSurface } from "@/components/ui/EcrinSurface";
import { Icon, type IconName } from "@/components/ui/Icon";
import { CONTACT, PHONE_E164, PHONE_LOCAL } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/*
  Footer on the écrin surface (DESIGN.md amendment 1): the real logo sits
  frameless; its dark ground was turned into alpha by
  scripts/prep-footer-logo.mjs so it melts into paillette.
  Reserves room for the StickyOrderBar on phones.
*/

const linkClass =
  "inline-flex min-h-11 items-center gap-2.5 no-underline decoration-cuivre decoration-2 underline-offset-[6px] hover:underline";

function ExternalItem({ href, icon, children }: { href: string; icon: IconName; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <li>
      <a href={href} className={linkClass} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        <Icon name={icon} size={20} className="text-cuivre" />
        {children}
      </a>
    </li>
  );
}

export function Footer() {
  const t = useTranslations("common");
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <EcrinSurface as="footer" className="pb-[calc(96px+env(safe-area-inset-bottom))] desk:pb-0">
      <div className="wrap grid gap-x-10 gap-y-10 pt-14 pb-10 desk:grid-cols-[1.3fr_1fr_1fr_1fr] desk:pt-20">
        <div className="max-w-[34ch]">
          <Image
            src="/Logo/logo-footer.webp"
            alt={t("footer.logo_alt")}
            width={560}
            height={391}
            sizes="(min-width: 900px) 280px, 240px"
            className="-ms-2 w-[240px] desk:w-[280px]"
          />
          <p className="mt-2 text-sucre/85">{t("footer.tagline")}</p>
        </div>

        <nav aria-labelledby="ft-explore">
          <h2 id="ft-explore" className="type-meta mb-2 font-semibold text-cuivre">
            {t("footer.explore_title")}
          </h2>
          <ul className="grid">
            <li>
              <Link href="/galerie" className={linkClass}>
                {t("nav.creations")}
              </Link>
            </li>
            <li>
              <Link href="/tiramisu" className={linkClass}>
                {t("nav.tiramisu")}
              </Link>
            </li>
            <li>
              <Link href="/galerie?c=wedding" className={linkClass}>
                {t("nav.weddings")}
              </Link>
            </li>
            <li>
              {/* /contact is the static QR page (public/qr), not an app route. */}
              <a href={locale === "fr" ? "/contact" : `/${locale}/contact`} className={linkClass}>
                {t("nav.contact")}
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="type-meta mb-2 font-semibold text-cuivre">{t("footer.contact_title")}</h2>
          <ul className="grid">
            <ExternalItem href={buildWhatsAppUrl({ locale, kind: "general" })} icon="whatsapp">
              {t("footer.whatsapp")}
            </ExternalItem>
            <ExternalItem href={`tel:${PHONE_E164}`} icon="phone">
              <bdi className="ltr">{PHONE_LOCAL}</bdi>
            </ExternalItem>
            <li className="flex min-h-11 items-center gap-2.5 text-sucre/85">
              <Icon name="pin" size={20} className="text-cuivre" />
              {t("footer.city")}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="type-meta mb-2 font-semibold text-cuivre">{t("footer.follow_title")}</h2>
          <ul className="grid">
            <ExternalItem href={CONTACT.instagram} icon="instagram">
              <bdi className="ltr">{CONTACT.instagramHandle}</bdi>
            </ExternalItem>
            <ExternalItem href={CONTACT.facebook} icon="facebook">
              {t("footer.facebook")}
            </ExternalItem>
          </ul>
        </div>
      </div>

      <div className="wrap pb-8">
        <p className="type-meta text-sucre/70">{t("footer.rights", { year })}</p>
      </div>
    </EcrinSurface>
  );
}
