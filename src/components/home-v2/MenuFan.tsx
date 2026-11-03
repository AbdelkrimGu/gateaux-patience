import { getTranslations } from "next-intl/server";
import SectionTone from "@/components/gp/SectionTone";
import Eyebrow from "@/components/gp/Eyebrow";
import FanDeck from "./FanDeck";
import type { FanCategory } from "./data";

/** 3 · Menu as a fan of prints, on cream after the ink evening. */
export default async function MenuFan({
  locale,
  categories,
  defaultSlug,
}: {
  locale: string;
  categories: FanCategory[];
  defaultSlug: string;
}) {
  const t = await getTranslations({ locale, namespace: "home.menu" });
  return (
    <SectionTone tone="cream" aria-labelledby="menu-title" className="overflow-hidden py-20 md:py-28">
      <div className="gp-container">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h2
          id="menu-title"
          className="mt-3 font-display text-step-head font-semibold leading-[1] tracking-[-0.035em] rtl:leading-[1.25] rtl:tracking-normal"
        >
          {t("title")}
        </h2>
        <FanDeck
          defaultSlug={defaultSlug}
          pillsLabel={t("pills_label")}
          seeLabel={t("see_gallery")}
          seeAria={Object.fromEntries(categories.map((c) => [c.slug, t("see_aria", { label: c.label })]))}
          categories={categories.map((c) => ({
            slug: c.slug,
            label: c.label,
            countLabel: String(c.count),
            href: c.href,
            photos: c.photos.map((p) => ({ src: p.src, alt: p.alt, href: p.href, sensitive: p.sensitive })),
          }))}
        />
      </div>
    </SectionTone>
  );
}
