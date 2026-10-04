import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/db-types";
import { CONTACT } from "@/lib/constants";

/*
  Instagram strip (DESIGN.md scope): an invitation to follow, with the real
  handle as a link. It promises nothing it doesn't show: no embed script, no
  follower count (not confirmed), no fake grid. Kept slim: one dragée band.
*/

export async function InstagramStrip({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home.instagram" });
  const handle = CONTACT.instagramHandle;

  return (
    <section aria-labelledby="insta-title" className="wrap py-10 desk:py-16">
      <div className="flex flex-col gap-4 rounded-band bg-dragee px-6 py-7 desk:flex-row desk:items-center desk:justify-between desk:gap-12 desk:px-12 desk:py-10">
        <div className="max-w-[38ch]">
          <h2 id="insta-title" className="type-band">
            {t("title")}
          </h2>
          <p className="type-meta mt-1.5 text-ink-soft">{t("text")}</p>
        </div>
        <a
          href={CONTACT.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("cta", { handle })}
          className="group inline-flex min-h-11 items-center gap-3 self-start rounded-pill text-framboise no-underline desk:self-auto"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white">
            <Icon name="instagram" size={22} />
          </span>
          <bdi
            dir="ltr"
            className="font-display text-[20px] leading-none tracking-[-0.01em] underline decoration-2 underline-offset-[6px] group-hover:decoration-[3px] desk:text-[26px]"
          >
            {handle}
          </bdi>
        </a>
      </div>
    </section>
  );
}
