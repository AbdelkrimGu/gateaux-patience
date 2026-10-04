import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { LetteredBoard, RefTag } from "@/components/ui/LetteredBoard";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CakeCard } from "@/components/ui/CakeCard";
import { EcrinSurface, Bezel } from "@/components/ui/EcrinSurface";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Wordmark } from "@/components/ui/Wordmark";
import { StickyOrderBar } from "@/components/layout/StickyOrderBar";
import { getFeaturedCakes } from "@/lib/cakes-data";
import { cakeRef } from "@/lib/cake-ref";
import { PIPING, pipingFor, pipingStyle, type PipingName } from "@/lib/piping";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { NameFieldDemo } from "./NameFieldDemo";

/*
  Living catalogue of the shared UI (Wave 2a). Not a public page:
  404 in production unless the server runs with GP_UI_KIT=1
  (`GP_UI_KIT=1 npx next start -p 3123`), so screenshots can still use it.
  Strings here are fixtures for the kit, not site copy.
*/
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "UI kit", robots: { index: false, follow: false } };

const ICONS: IconName[] = ["menu", "close", "chevron", "arrow", "back", "calendar", "guests", "gift", "pin", "instagram", "facebook", "check", "phone", "whatsapp"];

export default async function UiKit({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.GP_UI_KIT !== "1") notFound();
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });
  const cakes = await getFeaturedCakes(4);
  const first = cakes[0];
  const wedding = cakes.find((c) => c.category === "wedding") ?? cakes[1];

  return (
    <div className="wrap grid gap-16 pt-6 pb-24">
      <section className="grid items-start gap-10 desk:grid-cols-2">
        <div className="grid gap-4">
          <h1 className="type-h1">UI kit</h1>
          <p className="type-lead">Écrit en sucre — shared components for the page agents.</p>
          <NameFieldDemo locale={locale} label={t("name_field.label")} placeholder={t("name_field.placeholder")} />
          <div className="flex flex-wrap gap-3">
            <Button href={buildWhatsAppUrl({ locale, kind: "general" })} icon="whatsapp">
              {t("order.cta")}
            </Button>
            <Button href="/galerie" variant="ghost" iconEnd="chevron">
              {t("nav.creations")}
            </Button>
            <Button size="sm">{t("order.cta_short")}</Button>
          </div>
        </div>
        {first && (
          <LetteredBoard
            lang={locale}
            message={t("occasion.birthday")}
            name={locale === "ar" ? "يوتا" : "Youta"}
            image={{ src: first.images[0], alt: first.translations[locale].title, priority: true }}
            tag={<RefTag refCode={cakeRef(first.id)} label={first.categoryLabel[locale]} />}
            caption={t("occasion.birthday")}
            className="mx-auto w-[min(58vw,300px)] desk:w-[380px]"
            style={pipingStyle(pipingFor(first))}
          />
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="type-h2">Chips</h2>
        <div className="flex snap-x gap-2 overflow-x-auto">
          <Chip href="/ui-kit" selected count={23}>
            Tout
          </Chip>
          {(Object.keys(PIPING) as PipingName[]).map((p) => (
            <Chip key={p} href={`/ui-kit?c=${p}`} dot={p} count={3}>
              {p}
            </Chip>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="type-h2">Cards</h2>
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 desk:grid-cols-4 desk:gap-6">
          {cakes.map((c) => (
            <CakeCard key={c.id} cake={c} locale={locale} />
          ))}
        </div>
      </section>

      <EcrinSurface as="section" className="bleed grid gap-8 px-(--gutter) py-16 desk:grid-cols-2 desk:rounded-band">
        <div className="grid content-start gap-4">
          <h2 className="type-h2">Écrin</h2>
          <ol className="grid gap-5">
            {[1, 2, 3].map((n) => (
              <li key={n} className="grid grid-cols-[52px_1fr] items-start gap-3">
                <b className="font-display text-4xl leading-none font-normal text-cuivre">{n}</b>
                <span className="pt-1">Readex on paillette, copper numerals.</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3">
            <Button href={buildWhatsAppUrl({ locale, kind: "general" })} icon="whatsapp">
              {t("order.cta")}
            </Button>
            <Button variant="on-dark">{t("nav.creations")}</Button>
          </div>
        </div>
        {wedding && (
          <LetteredBoard
            tone="ecrin"
            lang={locale}
            message={t("occasion.wedding")}
            name={locale === "ar" ? "أمل و ياسين" : "Amel & Yacine"}
            image={{ src: wedding.images[0], alt: "" }}
            className="mx-auto w-[min(58vw,300px)] desk:w-[340px]"
            style={pipingStyle("or")}
          />
        )}
        <Bezel className="h-24 w-40 rounded-2xl" >
          <div className="size-full bg-dragee" />
        </Bezel>
      </EcrinSurface>

      <section className="grid gap-4">
        <h2 className="type-h2">Icons & wordmark</h2>
        <div className="flex flex-wrap gap-4">
          {ICONS.map((n) => (
            <span key={n} className="grid place-items-center gap-1 text-xs">
              <Icon name={n} />
              {n}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-8">
          <Wordmark layout="inline" />
          <Wordmark layout="stacked" />
        </div>
        <p className="type-band">Band title</p>
        <p className="type-card text-p-lilas">Card name</p>
        <p className="type-meta text-ink-muted">Meta line</p>
      </section>

      <StickyOrderBar waHref={buildWhatsAppUrl({ locale, kind: "general" })} />
    </div>
  );
}
