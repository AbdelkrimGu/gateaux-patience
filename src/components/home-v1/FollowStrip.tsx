import { getTranslations } from "next-intl/server";
import { Instagram } from "lucide-react";
import Eyebrow from "@/components/gp/Eyebrow";
import SectionTone from "@/components/gp/SectionTone";
import { CONTACT } from "@/lib/constants";
import type { HomePhoto } from "@/lib/home-data";
import StripRows from "./StripRows";

/** 8 · Follow along (champagne): the handle as giant display type + drifting photo rows. */
export default async function FollowStrip({
  locale,
  rows,
}: {
  locale: string;
  rows: [HomePhoto[], HomePhoto[]];
}) {
  const t = await getTranslations({ locale, namespace: "home.follow" });
  const handle = CONTACT.instagramHandle;

  return (
    <SectionTone tone="champagne" aria-labelledby="follow-title" className="overflow-x-clip pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="gp-container flex flex-col items-start justify-between gap-7 md:flex-row md:items-end">
        <div className="min-w-0">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2
            id="follow-title"
            dir="ltr"
            className="mt-3 font-display text-[clamp(2.3rem,0.9rem+5.6vw,6.25rem)] font-semibold leading-[0.95] tracking-[-0.045em] [overflow-wrap:anywhere] rtl:text-end"
          >
            {handle}
          </h2>
          <p className="mt-4 max-w-[40ch] text-step-body leading-relaxed text-tone-muted">{t("lead")}</p>
        </div>
        <a
          href={CONTACT.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 shrink-0 items-center gap-2.5 rounded-full bg-gp-ink px-6 text-[0.9375rem] font-semibold text-gp-cream shadow-gp-chip transition-transform duration-150 ease-gp hover:-translate-y-px active:scale-[0.97]"
        >
          <Instagram aria-hidden="true" className="h-[18px] w-[18px]" />
          {t("cta")}
        </a>
      </div>
      <div className="mt-10 md:mt-14">
        <StripRows rows={rows} />
      </div>
    </SectionTone>
  );
}
