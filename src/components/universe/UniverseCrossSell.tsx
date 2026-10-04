import { getLocale, getTranslations } from "next-intl/server";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { UNIVERSES, UNIVERSE_HREF, switchTypes, type Universe } from "./model";
import { UniverseImage } from "./UniverseImage";
import { IntentScope } from "./IntentScope";
import styles from "./cross-sell.module.css";

/*
  "Vous aimerez aussi" (07 §4.4): the end of every universe page leads to
  the OTHER two universes, so no page is a dead end. Server component; the
  locale comes from the request.

    <UniverseCrossSell current="sweets" />                 /douceurs
    <UniverseCrossSell current="cakes" />                  /galerie, detail
    <UniverseCrossSell current="tiramisu" tone="flat" />   inside the wizard

  Taps slide the page in switcher order and morph the card's picture into
  the destination's hero, like the switcher and the home gate.
*/

export async function UniverseCrossSell({
  current,
  cakesPhoto,
  tone = "section",
  className,
}: {
  current: Universe;
  /** Optional catalogue photo for the cakes card (else a real local photo). */
  cakesPhoto?: { src: string; position?: string };
  /** "section": a page section with gutter. "flat": no outer spacing (embedded). */
  tone?: "section" | "flat";
  className?: string;
}) {
  const locale = await getLocale();
  const [t, tt] = await Promise.all([
    getTranslations({ locale, namespace: "universe" }),
    getTranslations({ locale, namespace: "tiramisuUi.mode" }),
  ]);
  const others = UNIVERSES.filter((u) => u !== current);
  const id = `cross-sell-${current}`;

  return (
    <section
      aria-labelledby={id}
      className={cn(tone === "section" && "wrap py-12 desk:py-20", className)}
    >
      <h2 id={id} className="type-h2">
        {t("cross_title")}
      </h2>
      <p className="type-lead mt-2 desk:mt-3">{t("cross_lead")}</p>
      <IntentScope from={current}>
        <ul className={styles.list}>
          {others.map((u) => (
            <li key={u} className="flex">
              <Link
                href={UNIVERSE_HREF[u]}
                transitionTypes={switchTypes(current, u)}
                data-universe={u}
                className={cn(styles.card, styles[u])}
              >
                <span className={styles.media} data-universe-media="">
                  <UniverseImage
                    universe={u}
                    cakes={cakesPhoto}
                    word={tt("sample")}
                    sizes="(min-width: 900px) 260px, 46vw"
                  />
                </span>
                <span className={styles.copy}>
                  <h3 className={cn("type-card", styles.name)}>{t(`title.${u}`)}</h3>
                  <span className={styles.inside}>{t(`inside.${u}`)}</span>
                </span>
                <span aria-hidden="true" className={styles.arrow}>
                  <Icon name="arrow" size={20} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </IntentScope>
    </section>
  );
}
