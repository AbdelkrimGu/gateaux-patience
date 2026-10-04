import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/db-types";
import { CONTACT } from "@/lib/constants";

/*
  Instagram strip (DESIGN.md scope): the real handle as a link. No embed
  script, no follower count (not confirmed), no fake grid.
*/

export async function InstagramStrip({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home.instagram" });
  const handle = CONTACT.instagramHandle;

  return (
    <section aria-labelledby="insta-title" className="wrap py-14 desk:py-20">
      <div className="grid gap-4 desk:grid-cols-[minmax(0,1fr)_auto] desk:items-end desk:gap-12">
        <h2 id="insta-title" className="type-h2 max-w-[16ch]">
          {t("title")}
        </h2>
        <a
          href={CONTACT.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("cta", { handle })}
          className="group inline-flex min-h-11 items-center gap-3 justify-self-start rounded-pill text-framboise no-underline"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-dragee">
            <Icon name="instagram" size={22} />
          </span>
          <bdi
            dir="ltr"
            className="font-display text-[22px] leading-none tracking-[-0.01em] underline decoration-2 underline-offset-[6px] group-hover:decoration-[3px] desk:text-[30px]"
          >
            {handle}
          </bdi>
        </a>
      </div>
    </section>
  );
}
