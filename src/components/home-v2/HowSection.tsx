import { getImageProps } from "next/image";
import { getTranslations } from "next-intl/server";
import SectionTone from "@/components/gp/SectionTone";
import HowSlider from "./HowSlider";
import type { SoireeData } from "./data";

const KEYS = ["s1", "s2", "s3", "s4"] as const;

/** 5 · How it works: raspberry panel + photo, a cake-photo thumb to drag. */
export default async function HowSection({ locale, slider }: { locale: string; slider: SoireeData["slider"] }) {
  const t = await getTranslations({ locale, namespace: "home.steps" });
  const tw = await getTranslations({ locale, namespace: "order_wa" });
  const steps = KEYS.map((k, i) => ({
    title: t(`${k}_title`),
    text: t(`${k}_text`),
    valueText: t("step_value", { n: i + 1, total: KEYS.length, title: t(`${k}_title`) }),
    buttonLabel: t("step_button", { n: i + 1, title: t(`${k}_title`) }),
  }));
  // The range thumb is a CSS background: ask the optimizer for a 56px (2x) image.
  const thumb = getImageProps({ src: slider.thumb.src, alt: "", width: 56, height: 56, quality: 75 }).props.src;

  return (
    <SectionTone tone="raspberry" aria-labelledby="how-title" className="relative">
      <HowSlider
        eyebrow={t("eyebrow")}
        title={t("title")}
        hint={t("drag_hint")}
        sliderLabel={t("slider_label")}
        steps={steps}
        photos={slider.steps.map((p) => ({ src: p.src, alt: p.alt }))}
        thumb={thumb}
        chosen={{ src: slider.chosen.src, title: slider.chosen.categoryLabel, label: t("chosen") }}
        whatsapp={{ label: "WhatsApp", lines: [tw("hello"), tw("generic")] }}
        chips={[t("chip_size"), t("chip_flavour"), t("chip_decor"), t("chip_message")]}
        sticker={t("sticker")}
      />
    </SectionTone>
  );
}
