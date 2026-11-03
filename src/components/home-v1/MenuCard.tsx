import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Eyebrow from "@/components/gp/Eyebrow";
import SectionTone from "@/components/gp/SectionTone";
import RevealOnView from "./RevealOnView";

export interface MenuRow {
  name: string;
  href: string;
  thumb: string;
}
export interface MenuGroup {
  label: string;

  href?: string;
  rows: MenuRow[];
}

/**
 * 3 · The menu (raspberry section, cream paper card with scalloped edges).
 * Groups = categories that have cakes; rows = named cakes, dotted leader,
 * round photo. Its one moment: the leaders draw toward the photos, row by row.
 */
export default async function MenuCard({ locale, groups }: { locale: string; groups: MenuGroup[] }) {
  const t = await getTranslations({ locale, namespace: "home.menu" });
  let row = 0;

  return (
    <SectionTone tone="raspberry" data-header-tone="raspberry" aria-labelledby="menu-title" className="relative py-16 md:py-24">
      <div
        data-tone="cream"
        className="gp-scallop mx-auto w-[calc(100%-24px)] max-w-[620px] bg-gp-cream px-6 py-16 text-gp-ink md:px-12 md:py-20"
      >
        <div className="text-center">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2
            id="menu-title"
            className="mt-3 font-display text-step-head font-semibold leading-[1] tracking-[-0.035em] rtl:leading-[1.25] rtl:tracking-normal"
          >
            {t("title")}
          </h2>
        </div>

        <RevealOnView className="mt-10 space-y-9 md:mt-12">
          {groups.map((g) => (
            <div key={g.label}>
              <h3 className="text-center text-step-small font-semibold uppercase tracking-[0.18em] text-gp-raspberry rtl:normal-case rtl:tracking-normal">
                {g.href ? (
                  <Link href={g.href} className="inline-flex min-h-8 items-center gap-2 hover:underline">
                    {g.label}
                  </Link>
                ) : (
                  g.label
                )}

              </h3>
              <ul className="mt-3">
                {g.rows.map((r) => {
                  const i = row++;
                  return (
                    <li key={r.href + r.name}>
                      <Link
                        href={r.href}
                        className="group flex min-h-[60px] items-end gap-3 rounded-xl py-1.5 transition-colors duration-150"
                        style={{ "--i": i } as React.CSSProperties}
                      >
                        {/* Dotted leader runs from the end of the name's last line to the
                            photo: it sits behind the name, whose cream background hides it. */}
                        <span className="relative min-w-0 flex-1">
                          <span
                            aria-hidden="true"
                            className="gp-leader absolute inset-x-0 bottom-[0.42em] border-b-2 border-dotted border-gp-ink/30"
                          />
                          <span className="relative bg-gp-cream pe-2 text-step-body leading-snug text-gp-ink transition-colors duration-150 group-hover:text-gp-raspberry">
                            {r.name}
                          </span>
                        </span>                        <span className="gp-thumb relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gp-champagne ring-2 ring-gp-cream shadow-gp-chip transition-transform duration-300 ease-gp group-hover:scale-110">
                          <Image src={r.thumb} alt="" width={48} height={48} className="h-full w-full object-cover" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </RevealOnView>

        <div className="mt-12 text-center">
          <Link
            href="/galerie"
            className="group inline-flex min-h-11 items-center gap-2 border-b border-gp-ink/40 text-[0.9375rem] font-medium transition-colors hover:border-gp-raspberry hover:text-gp-raspberry"
          >
            {t("see_all")}
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-200 ease-gp group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </SectionTone>
  );
}
