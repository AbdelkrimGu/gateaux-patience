"use client";

import { Fragment, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const SHORT: Record<string, string> = { fr: "FR", ar: "ع", en: "EN" };
// Display order is fixed (FR · ع · EN) in both directions.
const ORDER = ["fr", "ar", "en"] as const;

/** "FR · ع · EN" — keeps the current page and its query (e.g. ?category=) when switching. */
export default function LangSwitch({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const t = useTranslations("frame");
  const locale = useLocale();
  const pathname = usePathname();
  // Query string is read after mount (useSearchParams would force a Suspense boundary).
  const [query, setQuery] = useState<Record<string, string>>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read-once browser state
    setQuery(Object.fromEntries(new URLSearchParams(window.location.search)));
  }, [pathname]);

  return (
    <nav aria-label={t("lang_aria")} className={cn("flex items-center", className)} dir="ltr">
      {ORDER.filter((l) => (routing.locales as readonly string[]).includes(l)).map((l, i) => {
        const current = l === locale;
        return (
          <Fragment key={l}>
            {i > 0 ? (
              <span aria-hidden="true" className="px-0.5 text-tone-fg/35">
                ·
              </span>
            ) : null}
            <Link
              href={{ pathname, query }}
              locale={l}
              lang={l}
              hrefLang={l}
              aria-current={current ? "true" : undefined}
              aria-label={t(`lang_${l}` as "lang_fr")}
              onClick={onNavigate}
              className={cn(
                "inline-flex h-11 min-w-8 items-center justify-center rounded-full px-1.5 text-[0.875rem] font-semibold transition-colors duration-150",
                l === "ar" && "text-[1.05rem]",
                current ? "text-tone-accent" : "text-tone-fg/70 hover:text-tone-fg"
              )}
            >
              {SHORT[l]}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
