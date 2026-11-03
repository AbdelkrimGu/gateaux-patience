import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Eyebrow from "@/components/gp/Eyebrow";
import SectionTone from "@/components/gp/SectionTone";
import { CONTACT } from "@/lib/constants";
import { getOrderHref } from "@/lib/order-server";

const QUESTIONS = [1, 2, 3, 4, 5, 6] as const;

/**
 * 7 · Questions (cream): a native <details> accordion — keyboard and screen
 * reader behaviour for free, one open at a time (`name`), the answer slides in.
 * Only answers we can state truthfully; no price, no delay.
 */
export default async function Faq({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.faq" });
  const order = await getOrderHref(locale);
  const tf = await getTranslations({ locale, namespace: "frame" });
  const linkCls =
    "font-medium text-gp-raspberry underline decoration-gp-raspberry/35 underline-offset-[5px] hover:decoration-gp-raspberry";
  const rich = {
    wa: (chunks: React.ReactNode) => (
      <a href={order()} target="_blank" rel="noopener noreferrer" className={linkCls}>
        {chunks}
        <span className="sr-only"> ({tf("opens_whatsapp")})</span>
      </a>
    ),
    tiramisu: (chunks: React.ReactNode) => (
      <Link href="/tiramisu" className={linkCls}>
        {chunks}
      </Link>
    ),
    gallery: (chunks: React.ReactNode) => (
      <Link href="/galerie" className={linkCls}>
        {chunks}
      </Link>
    ),
    ig: (chunks: React.ReactNode) => (
      <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" className={linkCls} dir="ltr">
        {chunks}
      </a>
    ),
    handle: CONTACT.instagramHandle,
  };

  return (
    <SectionTone tone="cream" aria-labelledby="faq-title" className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-[860px] px-4 md:px-8">
        <div className="text-center">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2
            id="faq-title"
            className="mt-3 font-display text-step-head font-semibold leading-[1] tracking-[-0.035em] rtl:leading-[1.25] rtl:tracking-normal"
          >
            {t("title")}
          </h2>
        </div>

        <div className="mt-10 border-t border-gp-ink/12 md:mt-14">
          {QUESTIONS.map((i) => (
            <details key={i} name="gp-faq" open={i === 1} className="gp-faq group border-b border-gp-ink/12">
              <summary className="flex min-h-[4.5rem] cursor-pointer list-none items-center justify-between gap-6 py-4 text-start md:min-h-[5.5rem]">
                <h3 className="font-display text-[clamp(1.2rem,1rem+0.9vw,1.75rem)] font-semibold leading-[1.15] tracking-[-0.025em] rtl:leading-[1.5] rtl:tracking-normal">
                  {t(`q${i}`)}
                </h3>
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gp-raspberry ring-1 ring-gp-raspberry/30 transition-[transform,background-color] duration-300 ease-gp group-open:rotate-45 group-open:bg-gp-raspberry group-open:text-gp-cream group-open:ring-0"
                >
                  <Plus className="h-5 w-5" />
                </span>
              </summary>
              <div className="gp-faq-answer pb-7 pe-14">
                <p className="max-w-[60ch] text-step-body leading-[1.65] text-gp-ink/75 rtl:leading-[1.85]">
                  {t.rich(`a${i}`, rich)}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </SectionTone>
  );
}
