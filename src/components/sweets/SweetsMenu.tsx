import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/db-types";
import { pipingStyle, type PipingName } from "@/lib/piping";
import { buildWhatsAppUrl, SWEET_TYPES, type SweetType } from "@/lib/whatsapp";
import { SweetMotif } from "./SweetMotif";
import styles from "./sweets.module.css";

/*
  "La carte des douceurs" (07 §5): one tile per sweet type. Each tile is a
  single link that opens WhatsApp with that sweet already named. Drawn
  motifs, not photos; no prices (none are confirmed: src/lib/business.ts).
  One piping colour per tile, never `or` (reserved for weddings).
*/

const COLOUR: Record<SweetType, PipingName> = {
  cupcakes: "lilas",
  cake_pops: "bleu",
  cakesicles: "rouge",
  desserts: "menthe",
};

export async function SweetsMenu({ locale, otherHref }: { locale: Locale; otherHref: string }) {
  const t = await getTranslations({ locale, namespace: "sweets.menu" });
  const tc = await getTranslations({ locale, namespace: "common" });

  return (
    <section id="carte" aria-labelledby="carte-title" className="wrap scroll-mt-[calc(var(--header-h)+16px)] pb-16 desk:pb-24">
      <h2 id="carte-title" className="type-h2">
        {t("title")}
      </h2>
      <p className="type-lead mt-3 max-w-[46ch] desk:mt-4">{t("intro")}</p>

      <ul className={`${styles.menu} mt-8 desk:mt-10`}>
        {SWEET_TYPES.map((type) => (
          <li key={type} style={pipingStyle(COLOUR[type])}>
            <a
              href={buildWhatsAppUrl({ locale, kind: "sweets", sweet: type, page: "/douceurs" })}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tile}
            >
              <SweetMotif type={type} className={styles.motif} />
              <h3 className={`type-card ${styles.name}`}>{t(`${type}.name`)}</h3>
              <p className={styles.text}>{t(`${type}.text`)}</p>
              <p className={styles.for}>{t(`${type}.for`)}</p>
              <span className={styles.action}>
                <Icon name="whatsapp" size={20} />
                <span>{t(`${type}.action`)}</span>
                <span className="sr-only">({tc("order.opens_whatsapp")})</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col items-start gap-4 desk:mt-12 desk:flex-row desk:items-center desk:gap-8">
        <p className="type-lead max-w-[44ch]">{t("other")}</p>
        <Button href={otherHref} variant="ghost" size="sm" icon="whatsapp" className="shrink-0">
          {t("other_cta")}
        </Button>
      </div>
    </section>
  );
}
