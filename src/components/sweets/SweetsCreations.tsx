import { getTranslations } from "next-intl/server";
import { CakeCard } from "@/components/ui/CakeCard";
import type { Cake, Locale } from "@/lib/db-types";
import { cn } from "@/lib/utils";

/*
  Real sweets already made: published items of the sweets-universe
  categories, as gallery cards (07 §5). Renders nothing when there are none:
  no "coming soon" emptiness. With one or two items the cards sit beside
  the heading instead of leaving a mostly empty 4-column row.

  OWNER: add photos through Admin > Catégories, in a category whose
  "Univers" is "Douceurs" (see src/lib/universes.ts).
*/

const SIZES = "(min-width: 1240px) 290px, (min-width: 900px) 23vw, 46vw";

export async function SweetsCreations({ locale, cakes }: { locale: Locale; cakes: Cake[] }) {
  if (cakes.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "sweets.creations" });
  const few = cakes.length < 3;

  return (
    <section
      aria-labelledby="sweets-creations"
      className={cn(
        "wrap pb-16 desk:pb-24",
        few && "desk:grid desk:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] desk:items-center desk:gap-12"
      )}
    >
      <div>
        <h2 id="sweets-creations" className="type-h2 max-w-[18ch]">
          {t("title")}
        </h2>
        <p className="type-lead mt-3">{t("intro")}</p>
      </div>
      <ul
        className={cn(
          "mt-6 grid grid-cols-2 gap-x-3 gap-y-6 desk:gap-x-6 desk:gap-y-10",
          few ? "desk:mt-0" : "desk:mt-10 desk:grid-cols-4"
        )}
      >
        {cakes.map((cake) => (
          <li key={cake.id}>
            <CakeCard cake={cake} locale={locale} sizes={SIZES} />
          </li>
        ))}
      </ul>
    </section>
  );
}
