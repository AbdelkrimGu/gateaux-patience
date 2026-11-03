import { useLocale, useTranslations } from "next-intl";
import { ArrowUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CONTACT, PHONE_E164 } from "@/lib/constants";
import { useOrderHref } from "@/lib/order";
import { BrandBadge } from "../Brand";
import DashedRingCta from "../DashedRingCta";
import Eyebrow from "../Eyebrow";
import WhatsAppIcon from "../WhatsAppIcon";
import { NAV_ITEMS, localePath } from "../header/nav";

const linkCls =
  "inline-flex min-h-9 items-center gap-2 text-tone-fg/80 md:min-h-10 transition-colors duration-150 hover:text-tone-fg";

/** Shared footer content (tagline, CTA, links, contact, social, credit). Used inside both footers. */
export default function FooterBody({ showTagline = true }: { showTagline?: boolean }) {
  const t = useTranslations("footer_gp");
  const tf = useTranslations("frame");
  const locale = useLocale();
  const order = useOrderHref();
  const year = new Date().getFullYear();

  return (
    <div className="gp-container">
      <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-8">
        {showTagline ? (
          <div className="md:col-span-7">
            <p className="font-display text-[clamp(2.3rem,1.3rem+4.4vw,5.2rem)] font-semibold leading-[0.94] tracking-[-0.045em] rtl:leading-[1.2] rtl:tracking-normal">
              {t("line1")}
              <br />
              <span className="text-tone-accent">{t("line2")}</span>
            </p>
            <p className="mt-4 max-w-[42ch] md:mt-5 text-[0.9375rem] leading-relaxed text-tone-muted md:text-base">
              {t("pitch")}
            </p>
            <DashedRingCta href={order()} srHint={tf("opens_whatsapp")} size="md" className="mt-6 md:mt-8">
              {tf("order_full")}
            </DashedRingCta>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 text-[0.9375rem] md:col-span-5">
          <div>
            <Eyebrow as="p">{t("explore")}</Eyebrow>
            <ul className="mt-2 md:mt-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  {item.external ? (
                    <a href={localePath(locale, item.href)} className={linkCls}>
                      {tf(item.key)}
                    </a>
                  ) : (
                    <Link href={item.href} className={linkCls}>
                      {tf(item.key)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow as="p">{t("reach")}</Eyebrow>
            <ul className="mt-2 md:mt-3">
              <li>
                <a href={order()} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  <WhatsAppIcon className="h-4 w-4 shrink-0" />
                  {t("whatsapp")}
                </a>
              </li>
              <li>
                <a href={`tel:${PHONE_E164}`} className={linkCls} aria-label={t("call_aria", { phone: CONTACT.phone })}>
                  <span dir="ltr" className="tabular">
                    {CONTACT.phone}
                  </span>
                </a>
              </li>
              <li>
                <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  <span dir="ltr">{CONTACT.instagramHandle}</span>
                </a>
              </li>
              <li>
                <a href={CONTACT.facebook} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  Facebook
                </a>
              </li>
              <li className="pt-1.5 text-tone-muted">{t("city")}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-tone-fg/15 pt-5 text-[0.8125rem] text-tone-muted md:mt-12 md:pt-6">
        <span className="flex w-full items-center gap-3 sm:w-auto">
          <BrandBadge size={32} />
          {t("copyright", { year: String(year) })}
        </span>
        <span className="flex items-center gap-1.5">
          {t("partner")}
          <a
            href="https://codewavestudio.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center font-medium text-tone-fg/85 underline decoration-tone-fg/30 hover:decoration-tone-fg"
          >
            Codewave Studio
          </a>
        </span>
        <a
          href="#top"
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.875rem] font-medium text-tone-fg/85 ring-1 ring-inset ring-tone-fg/25 transition-colors hover:bg-tone-fg/10"
        >
          <ArrowUp aria-hidden="true" className="h-4 w-4" />
          {t("back_to_top")}
        </a>
      </div>
    </div>
  );
}
