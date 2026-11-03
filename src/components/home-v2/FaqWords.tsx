import { getTranslations } from "next-intl/server";
import SectionTone from "@/components/gp/SectionTone";
import Eyebrow from "@/components/gp/Eyebrow";
import WhatsAppIcon from "@/components/gp/WhatsAppIcon";
import { CONTACT } from "@/lib/constants";
import { getOrderHref } from "@/lib/order-server";

const N = [1, 2, 3, 4, 5, 6] as const;

/**
 * 8 · "In our words": always-open Q&A, two columns on desktop, one on phones.
 * The quiet rest between two showpieces: no motion at all.
 */
export default async function FaqWords({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.faq" });
  const tf = await getTranslations({ locale, namespace: "frame" });
  const order = await getOrderHref(locale);

  return (
    <SectionTone tone="cream" aria-labelledby="faq-title" className="py-20 md:py-32">
      <div className="gp-container grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--gp-header-h)+2rem)]">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2
              id="faq-title"
              className="mt-3 font-display text-step-head font-semibold leading-[1] tracking-[-0.035em] rtl:leading-[1.25] rtl:tracking-normal"
            >
              {t("title")}
            </h2>
            <p className="mt-5 max-w-[34ch] text-step-body leading-[1.6] text-gp-ink/70">{t("lead")}</p>
            <a
              href={order()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex min-h-12 items-center gap-2.5 rounded-full px-5 text-[0.9375rem] font-semibold text-gp-ink ring-1 ring-inset ring-gp-ink/25 transition-colors hover:bg-gp-ink/[0.05]"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] text-gp-raspberry" />
              {t("more")}
              <span className="sr-only"> ({tf("opens_whatsapp")})</span>
            </a>
          </div>
        </div>

        <dl className="grid gap-x-12 gap-y-12 md:grid-cols-2 lg:col-span-8 lg:gap-y-14">
          {N.map((n) => (
            <div key={n}>
              <dt className="flex gap-3 font-display text-[clamp(1.3rem,1.1rem+0.6vw,1.65rem)] font-semibold leading-[1.15] tracking-[-0.02em] rtl:leading-[1.45] rtl:tracking-normal">
                <span aria-hidden="true" className="shrink-0 text-gp-raspberry">
                  {t("q_mark")}
                </span>
                <span>{t(`q${n}`)}</span>
              </dt>
              <dd className="mt-4 border-s-2 border-gp-raspberry/35 ps-5 text-step-body leading-[1.65] text-gp-ink/75">
                {n === 5 ? (
                  <>
                    {t.rich("a5_rich", {
                      handle: () => (
                        <a
                          href={CONTACT.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          className="font-medium text-gp-raspberry underline decoration-gp-raspberry/35 hover:decoration-gp-raspberry"
                        >
                          {CONTACT.instagramHandle}
                        </a>
                      ),
                    })}
                  </>
                ) : (
                  t(`a${n}`)
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </SectionTone>
  );
}
