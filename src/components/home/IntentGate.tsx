import { getTranslations } from "next-intl/server";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { Icon } from "@/components/ui/Icon";
import { UniverseImage } from "@/components/universe/UniverseImage";
import { IntentScope } from "@/components/universe/IntentScope";
import { UNIVERSES, UNIVERSE_HREF, VT_GATE, type Universe } from "@/components/universe/model";
import type { Locale } from "@/lib/db-types";
import { cn } from "@/lib/utils";
import { ResumeChip } from "./ResumeChip";
import s from "./gate.module.css";

/*
  The home page is a question (07 §1, §3): "Qu'est-ce qui vous ferait
  plaisir ?" and three answers, each one tap to its universe. Server
  rendered and never opacity-gated: the H1, the cards and their photos
  paint from the HTML. The only client code is the tap handler (shared
  element morph + gp:intent event) and the returning-visitor chip.
*/

const RESUME_MAX = 20;

export async function IntentGate({
  locale,
  cakesPhoto,
}: {
  locale: Locale;
  cakesPhoto?: { src: string; position?: string };
}) {
  const [t, tu, tt] = await Promise.all([
    getTranslations({ locale, namespace: "home.gate" }),
    getTranslations({ locale, namespace: "universe" }),
    getTranslations({ locale, namespace: "tiramisuUi.mode" }),
  ]);

  // Chip strings for the client, pre-formatted on the server (no ICU runtime
  // in the browser): "Reprendre : Douceurs", "… votre tiramisu : 2 boîtes".
  const resume = {
    universe: Object.fromEntries(UNIVERSES.map((u) => [u, tu("resume.universe", { universe: tu(`short.${u}`) })])) as Record<
      Universe,
      string
    >,
    boxes: Array.from({ length: RESUME_MAX }, (_, i) => tu("resume.tiramisu", { count: i + 1 })),
  };

  return (
    <section aria-labelledby="gate-title" className={cn("wrap", s.gate)}>
      <h1 id="gate-title" className={cn("type-h1", s.title)}>
        {t("title")}
      </h1>
      <div className={s.slot}>
        <ResumeChip strings={resume} fallback={<p className={s.subline}>{t("subline")}</p>} />
      </div>

      <IntentScope from="home" className="contents">
        <ul aria-label={t("choices_label")} className={s.list}>
          {UNIVERSES.map((u, i) => (
            <li key={u}>
              <Link
                href={UNIVERSE_HREF[u]}
                transitionTypes={[VT_GATE]}
                data-universe={u}
                className={cn(s.card, s[u])}
              >
                <span className={s.copy}>
                  <h2 className={cn("type-band", s.name)}>{tu(`title.${u}`)}</h2>
                  <span className={s.inside}>{tu(`inside.${u}`)}</span>
                </span>
                <span aria-hidden="true" className={s.arrow}>
                  <Icon name="arrow" size={22} />
                </span>
                <span className={s.media} data-universe-media="">
                  <UniverseImage
                    universe={u}
                    cakes={cakesPhoto}
                    word={tt("sample")}
                    sizes="(min-width: 1240px) 380px, (min-width: 900px) 30vw, 42vw"
                    // The first card's photo is the likeliest LCP on phones.
                    priority={i === 0}
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </IntentScope>
    </section>
  );
}
