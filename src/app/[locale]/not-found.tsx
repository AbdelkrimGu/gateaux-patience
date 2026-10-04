import { useLocale, useTranslations } from "next-intl";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { LetteredBoard } from "@/components/ui/LetteredBoard";
import { Button } from "@/components/ui/Button";
import { pipingStyle } from "@/lib/piping";

// Localized 404 (unknown paths via [...rest], notFound() from pages).
// The plate is empty on purpose: the cake you were looking for isn't here.
export default function NotFound() {
  const t = useTranslations("common.not_found");
  const locale = useLocale();

  return (
    <SiteChrome>
      <title>{`${t("meta_title")} | Gateaux Patience`}</title>
      <meta name="robots" content="noindex" />
      <section className="wrap grid items-center gap-x-18 gap-y-6 pt-4 pb-16 desk:grid-cols-[1.15fr_0.85fr] desk:pt-10 desk:pb-24">
        <div className="grid gap-4 desk:gap-6">
          <h1 className="type-h1 max-w-[12ch]">{t("title")}</h1>
          <p className="type-lead">{t("text")}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button href="/galerie" iconEnd="chevron">
              {t("gallery")}
            </Button>
            <Button href="/" variant="ghost">
              {t("home")}
            </Button>
          </div>
        </div>
        <LetteredBoard
          message={t("ring")}
          lang={locale}
          className="order-first mx-auto w-[min(48vw,230px)] desk:order-none desk:w-[340px]"
          style={pipingStyle("or")}
        />
      </section>
    </SiteChrome>
  );
}
