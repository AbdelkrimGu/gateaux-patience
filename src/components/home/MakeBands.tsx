import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import type { Locale } from "@/lib/db-types";
import { WEDDING_SLUGS } from "@/lib/piping";
import { cn } from "@/lib/utils";
import { TiramisuWord } from "./TiramisuWord";
import styles from "./MakeBands.module.css";

/*
  "Ce qu'on prépare": three bands, each one link.
    Gâteaux sur mesure      -> /galerie            (cake photo, bleu field)
    Tiramisu personnalisé   -> /tiramisu           (heart box + typed name)
    Mariages & fiançailles  -> /galerie?c=wedding  (écrin surface, copper)
*/

export interface BandPhoto {
  src: string;
  /** CSS object-position inside the circle. */
  position?: string;
}

const PHOTO_SIZES = "(min-width: 900px) 220px, 150px";

export async function MakeBands({
  locale,
  cakesPhoto,
  weddingPhoto,
}: {
  locale: Locale;
  cakesPhoto?: BandPhoto;
  weddingPhoto?: BandPhoto;
}) {
  const t = await getTranslations({ locale, namespace: "home.make" });

  const photo = (p?: BandPhoto) =>
    p ? (
      <div className={styles.photo} aria-hidden="true">
        <Image
          src={p.src}
          alt=""
          fill
          sizes={PHOTO_SIZES}
          className="photo-grade"
          style={p.position ? { objectPosition: p.position } : undefined}
        />
      </div>
    ) : null;

  return (
    <section aria-labelledby="make-title" className="wrap pt-10 pb-4 desk:pt-12 desk:pb-8">
      <h2 id="make-title" className="type-h2 mb-6 desk:mb-10">
        {t("title")}
      </h2>
      <ul className={styles.bands}>
        <li>
          <Link href="/galerie" className={cn(styles.band, styles.cakes)}>
            <div className={styles.copy}>
              <h3 className="type-band">{t("cakes_title")}</h3>
              <p className={styles.text}>{t("cakes_text")}</p>
              <span className={styles.action}>{t("cakes_action")}</span>
            </div>
            {photo(cakesPhoto)}
          </Link>
        </li>
        <li>
          <Link href="/tiramisu" className={cn(styles.band, styles.tiramisu)}>
            <div className={styles.copy}>
              <h3 className="type-band">{t("tiramisu_title")}</h3>
              <p className={styles.text}>{t("tiramisu_text")}</p>
              <span className={styles.action}>{t("tiramisu_action")}</span>
            </div>
            <div className={styles.tira} aria-hidden="true">
              <Image src="/images/tiramisu/boxes/box-heart.png" alt="" fill sizes={PHOTO_SIZES} />
              <TiramisuWord sample={t("tiramisu_sample")} />
            </div>
          </Link>
        </li>
        <li>
          <Link href={`/galerie?c=${WEDDING_SLUGS[0]}`} className={cn(styles.band, styles.wedding, "ecrin sequin")}>
            <div className={styles.copy}>
              <h3 className="type-band">{t("wedding_title")}</h3>
              <p className={styles.text}>{t("wedding_text")}</p>
              <span className={styles.action}>{t("wedding_action")}</span>
            </div>
            {photo(weddingPhoto)}
          </Link>
        </li>
      </ul>
    </section>
  );
}
