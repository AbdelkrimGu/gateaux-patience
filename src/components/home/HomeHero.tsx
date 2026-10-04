import { getTranslations } from "next-intl/server";
import type { Cake, Locale } from "@/lib/db-types";
import { cakeRef } from "@/lib/cake-ref";
import { CONTACT } from "@/lib/constants";
import { HeroOrder } from "./HeroOrder";

/*
  Hero (B §2, §5): H1 + lead (server), then the lettered board, the name
  field and the WhatsApp CTA (one client island). Phone: one column in that
  order, all of it inside 390×844. Desktop (≥900): copy 1.15fr, board .85fr.
*/

export async function HomeHero({ locale, cake }: { locale: Locale; cake: Cake | null }) {
  const t = await getTranslations({ locale, namespace: "home.hero" });
  const common = await getTranslations({ locale, namespace: "common" });

  const title = cake ? (cake.translations[locale]?.title || cake.translations.fr.title).trim() : "";
  const refCode = cake ? cakeRef(cake.id) : "";

  return (
    <section
      aria-labelledby="home-title"
      className="wrap grid grid-cols-1 gap-3 pt-2 pb-12 desk:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] desk:content-center desk:gap-x-14 desk:gap-y-6 desk:pt-6 desk:pb-24"
    >
      <h1
        id="home-title"
        className="type-h1 max-w-[11ch] [@media(max-width:899px)_and_(max-height:760px)]:text-[34px] desk:max-w-none desk:self-end desk:text-[clamp(56px,5.8vw,86px)]"
      >
        {t("title")}
      </h1>
      <p className="type-lead">{t("lead", { year: CONTACT.founded })}</p>

      <HeroOrder
        locale={locale}
        message={common("occasion.birthday")}
        image={cake?.images[0] ? { src: cake.images[0], alt: title, position: "50% 40%" } : undefined}
        cake={cake ? { href: `/galerie/${cake.slug}`, refCode, refAria: t("ref_aria", { ref: refCode }) } : undefined}
        caption={t("caption")}
        field={{ label: common("name_field.label"), placeholder: common("name_field.placeholder") }}
        cta={common("order.cta")}
        note={t("note")}
        seeCreations={t("see_creations")}
      />
    </section>
  );
}
