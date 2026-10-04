import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/db-types";
import { CONTACT } from "@/lib/constants";

/*
  Below the gate, for people who scroll (07 §3): who makes all this, in
  two sentences. Only confirmed facts: founding year and city
  (src/lib/contact.json). No counts, no reviews.
*/

export async function BrandStrip({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home.brand" });
  return (
    <section aria-labelledby="brand-title" className="wrap py-14 desk:py-24">
      <div className="grid gap-4 desk:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] desk:items-end desk:gap-16">
        <div>
          <p className="font-display text-[20px] leading-none text-framboise desk:text-[26px]">
            {t("since", { year: CONTACT.founded })}
          </p>
          <h2 id="brand-title" className="type-h2 mt-3 max-w-[18ch] desk:mt-4">
            {t("title")}
          </h2>
        </div>
        <p className="type-lead desk:pb-1">{t("text", { year: CONTACT.founded })}</p>
      </div>
    </section>
  );
}
