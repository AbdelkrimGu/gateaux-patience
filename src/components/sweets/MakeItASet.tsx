import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/db-types";
import { SET_PHOTOS } from "@/lib/universes-core";
import styles from "./sweets.module.css";

/*
  "Make it a set" (07 §5): sweets matched to a cake, plus tiramisu boxes.
  Specific to pairing, so it can sit next to (or be swapped for) the
  generic cross-sell block. The photo is a REAL set she made: a Rapunzel
  cake with its princess cupcakes, same order, same table.
*/

export async function MakeItASet({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "sweets.set" });
  const photo = SET_PHOTOS.princess;

  return (
    <section aria-labelledby="sweets-set" className="wrap pb-16 desk:pb-24">
      <div className="grid gap-6 rounded-band bg-dragee px-5 py-6 desk:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] desk:items-center desk:gap-14 desk:px-12 desk:py-12">
        <figure className="m-0 grid gap-3">
          <div className={`${styles.setPhoto} w-full max-w-[340px] justify-self-center desk:max-w-[380px]`}>
            <Image
              src={photo.src}
              alt={t("photo_alt")}
              fill
              sizes="(min-width: 900px) 380px, min(calc(100vw - 72px), 340px)"
              className="photo-grade object-cover object-[50%_42%]"
            />
          </div>
          <figcaption className="type-meta text-center text-ink-muted">{t("caption")}</figcaption>
        </figure>
        <div>
          <h2 id="sweets-set" className="type-h2 max-w-[16ch]">
            {t("title")}
          </h2>
          <p className="type-lead mt-3 max-w-[44ch] desk:mt-5">{t("text")}</p>
          <div className="mt-6 flex flex-col gap-3 desk:mt-8 desk:flex-row desk:flex-wrap">
            <Button href="/galerie" variant="ghost" iconEnd="chevron">
              {t("cakes")}
            </Button>
            <Button href="/tiramisu" variant="ghost" iconEnd="chevron">
              {t("tiramisu")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
