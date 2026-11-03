import { getTranslations } from "next-intl/server";
import Eyebrow from "@/components/gp/Eyebrow";
import OutlinedNumeral from "@/components/gp/OutlinedNumeral";
import SectionTone from "@/components/gp/SectionTone";
import { OrderScreen, Phone, type ScreenLabels, type StoryPhotos } from "./OrderScreens";
import WatchOrderScrub from "./WatchOrderScrub";

/**
 * 6 · How it works (ink). Desktop/tablet: the pinned, scroll-scrubbed phone
 * story (client island). Phones (< 768px): not pinned — four stacked steps,
 * each with a small 9:15 phone rendered on the server.
 */
export default async function WatchOrder({ locale, photos }: { locale: string; photos: StoryPhotos }) {
  const t = await getTranslations({ locale, namespace: "home.steps" });
  const tw = await getTranslations({ locale, namespace: "order_wa" });
  const tf = await getTranslations({ locale, namespace: "frame" });
  const steps = [1, 2, 3, 4].map((i) => ({
    title: t(`s${i}_title` as "s1_title"),
    text: t(`s${i}_text` as "s1_text"),
  }));
  const labels: ScreenLabels = {
    gallery: tf("gallery"),
    waLabel: t("wa_label"),
    waInput: t("wa_input"),
    message: `${tw("hello")} ${tw("cake", { cake: photos.chosen.alt })}`,
    personalise: t("s3_title"),
    chips: [t("chip_size"), t("chip_flavour"), t("chip_decor"), t("chip_message")],
    sticker: t("sticker"),
  };

  return (
    <SectionTone tone="ink" aria-label={t("title")} className="relative">
      <WatchOrderScrub
        eyebrow={t("eyebrow")}
        title={t("title")}
        steps={steps}
        inspiration={t("inspiration")}
        photos={photos}
        labels={labels}
      />

      <div className="gp-container py-20 md:hidden">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h2 className="mt-3 font-display text-step-head font-semibold leading-[1.02] tracking-[-0.035em] rtl:leading-[1.3] rtl:tracking-normal">
          {t("title")}
        </h2>
        <ol className="mt-10 space-y-6">
          {steps.map((s, i) => (
            <li key={i} className="grid grid-cols-[1fr_auto] items-start gap-x-4 border-t border-gp-cream/12 pt-6">
              <div className="min-w-0">
                <OutlinedNumeral value={i + 1} className="gp-num-ink text-[4.25rem] tracking-[-0.04em]" />
                <h3 className="mt-2 font-display text-[1.6rem] font-semibold leading-[1.05] tracking-[-0.03em] rtl:leading-[1.35] rtl:tracking-normal">
                  {s.title}
                </h3>
                <p className="mt-2 text-[0.975rem] leading-[1.55] text-gp-cream/75">{s.text}</p>
              </div>
              {/* Small phone: the 300×500 phone scaled to half. */}
              <div className="relative h-[250px] w-[150px] shrink-0">
                <div className="absolute start-0 top-0 origin-top-left scale-50 rtl:origin-top-right">
                  <Phone short className="shadow-[0_30px_50px_-24px_rgb(0_0_0/0.7)]">
                    <OrderScreen step={i} photos={photos} labels={labels} live={false} short />
                  </Phone>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </SectionTone>
  );
}
