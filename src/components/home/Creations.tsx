import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { CakeCard } from "@/components/ui/CakeCard";
import type { Cake, Locale } from "@/lib/db-types";

/*
  "Déjà fêtés à Sidi Bel Abbès": the owner's featured cakes (up to 8),
  2 columns on phones, 4 on desktop (B §5). Titles are her DB titles.
  Hidden if the catalogue is empty.
*/

export async function Creations({ locale, cakes }: { locale: Locale; cakes: Cake[] }) {
  if (cakes.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "home.creations" });

  return (
    <section id="creations" aria-labelledby="creations-title" className="wrap scroll-mt-4 py-12 desk:py-24">
      <h2 id="creations-title" className="type-h2 mb-6 desk:mb-10">
        {t("title")}
      </h2>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 desk:grid-cols-4 desk:gap-x-6 desk:gap-y-10">
        {cakes.map((cake) => (
          <li key={cake.id}>
            <CakeCard cake={cake} locale={locale} />
          </li>
        ))}
      </ul>
      <div className="mt-8 flex justify-center desk:mt-12">
        <Button href="/galerie" variant="ghost">
          {t("all")}
        </Button>
      </div>
    </section>
  );
}
