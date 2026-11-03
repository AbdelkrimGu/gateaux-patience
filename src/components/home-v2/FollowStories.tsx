import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SectionTone from "@/components/gp/SectionTone";
import Eyebrow from "@/components/gp/Eyebrow";
import { BrandBadge } from "@/components/gp/Brand";
import { CONTACT } from "@/lib/constants";
import Reveal from "./Reveal";
import InstagramIcon from "./InstagramIcon";
import type { StoryCircle, V2Photo } from "./data";

/** A story-highlight ring: raspberry → gold, drawn on enter (CSS, via data-reveal). */
function Ring({ i, width = 3 }: { i: number; width?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="hv2-ring absolute inset-0 h-full w-full -rotate-90">
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke="url(#hv2-ring-grad)"
        strokeWidth={width}
        strokeLinecap="round"
        pathLength={1}
        style={{ "--i": i } as React.CSSProperties}
      />
    </svg>
  );
}

/**
 * 9 · "Our stories": an Instagram profile in brand colours — logo avatar,
 * handle, follow pill, story highlights = the categories with cakes (→ gallery
 * filter), and a six-photo grid that opens Instagram.
 */
export default async function FollowStories({
  locale,
  stories,
  grid,
}: {
  locale: string;
  stories: StoryCircle[];
  grid: V2Photo[];
}) {
  const t = await getTranslations({ locale, namespace: "home.follow" });
  return (
    <SectionTone tone="champagne" aria-labelledby="follow-title" className="py-20 md:py-28">
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="hv2-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "rgb(var(--gp-raspberry))" }} />
            <stop offset="1" style={{ stopColor: "rgb(var(--gp-gold))" }} />
          </linearGradient>
        </defs>
      </svg>
      <Reveal className="hv2-stories mx-auto w-full max-w-[1140px] px-4 md:px-8" threshold={0.2}>
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-6 md:grid-cols-[auto_1fr_auto] md:gap-x-10">
          <div className="relative h-24 w-24 p-[7px] md:h-40 md:w-40 md:p-[10px]">
            <Ring i={0} width={2.5} />
            <BrandBadge size={146} className="!h-full !w-full ring-0" />
          </div>
          <div className="min-w-0">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2
              id="follow-title"
              dir="ltr"
              className="mt-1 truncate font-display text-[clamp(1.35rem,0.6rem+3.6vw,4.4rem)] font-semibold leading-[1.05] tracking-[-0.04em] rtl:text-end"
            >
              {CONTACT.instagramHandle}
            </h2>
            <p className="mt-2 hidden max-w-[44ch] text-step-body text-gp-ink/70 md:block">{t("lead")}</p>
          </div>
          <p className="col-span-2 -mt-2 text-step-body text-gp-ink/70 md:hidden">{t("lead")}</p>
          <a
            href={CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-gp-ink px-6 text-[0.9375rem] font-semibold text-gp-cream transition-transform duration-150 ease-gp active:scale-[0.97] md:col-span-1"
          >
            <InstagramIcon className="h-[18px] w-[18px]" />
            {t("cta")}
          </a>
        </div>

        <nav aria-label={t("stories_label")} className="-mx-4 mt-12 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:mt-16 md:px-0">
          <ul className="flex w-max gap-5 md:w-full md:justify-between md:gap-4">
            {stories.map((s, i) => (
              <li key={s.slug}>
                <Link href={s.href} className="group flex w-[5.5rem] flex-col items-center gap-2.5 rounded-2xl md:w-32">
                  <span className="relative block h-[5.5rem] w-[5.5rem] p-[6px] md:h-32 md:w-32 md:p-[8px]">
                    <Ring i={i + 1} />
                    <span className="relative block h-full w-full overflow-hidden rounded-full bg-gp-cream">
                      <Image
                        src={s.cover.src}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 112px, 76px"
                        className="object-cover transition-transform duration-500 ease-gp group-hover:scale-105"
                        style={{ objectPosition: "50% 45%" }}
                      />
                    </span>
                  </span>
                  <span className="line-clamp-2 text-center text-[0.875rem] font-medium leading-tight md:text-[0.9375rem]">
                    {s.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="mt-10 grid grid-cols-3 gap-1.5 md:mt-14 md:gap-3">
          {grid.map((p) => (
            <li key={p.src}>
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("grid_aria", { title: p.alt })}
                className="group relative block aspect-square overflow-hidden rounded-[10px] bg-gp-cream md:rounded-[18px]"
              >
                <Image
                  src={p.src}
                  alt=""
                  fill
                  sizes="(min-width: 1140px) 360px, 32vw"
                  className="object-cover transition-transform duration-500 ease-gp group-hover:scale-[1.04]"
                  style={{ objectPosition: "50% 45%" }}
                />
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </SectionTone>
  );
}
