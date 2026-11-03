import { getTranslations } from "next-intl/server";
import SectionTone from "@/components/gp/SectionTone";
import Eyebrow from "@/components/gp/Eyebrow";
import { getOrderHref } from "@/lib/order-server";
import OccasionWords from "./OccasionWords";
import type { Occasion } from "./data";

/** 4 · "Que fêtez-vous ?" — big words + sticky photo card, on champagne. */
export default async function OccasionsSection({ locale, occasions }: { locale: string; occasions: Occasion[] }) {
  const t = await getTranslations({ locale, namespace: "home.occasions" });
  const tf = await getTranslations({ locale, namespace: "frame" });
  const order = await getOrderHref(locale);

  return (
    <SectionTone tone="champagne" aria-labelledby="occasions-title" className="py-20 md:pb-16 md:pt-28">
      <div className="gp-container">
        <OccasionWords
          heading={
            <>
              <Eyebrow>{t("eyebrow")}</Eyebrow>
              <h2
                id="occasions-title"
                className="mt-3 font-display text-step-head font-semibold leading-[1] tracking-[-0.035em] rtl:leading-[1.25] rtl:tracking-normal"
              >
                {t("title")}
              </h2>
            </>
          }
          listLabel={t("list_label")}
          orderLabel={tf("order_full")}
          opensWa={tf("opens_whatsapp")}
          items={occasions.map((o) => ({
            slug: o.slug,
            label: o.label,
            seeLabel: t("see_count", { count: o.count }),
            href: o.href,
            orderHref: order({ occasion: o.label }),
            main: { src: o.main.src, alt: o.main.alt },
            insets: o.insets.slice(0, 2).map((p) => ({ src: p.src, alt: p.alt })),
          }))}
        />
      </div>
    </SectionTone>
  );
}
