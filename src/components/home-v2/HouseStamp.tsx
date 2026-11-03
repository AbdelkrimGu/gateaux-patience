import { getTranslations } from "next-intl/server";
import SectionTone from "@/components/gp/SectionTone";
import Eyebrow from "@/components/gp/Eyebrow";
import Print from "@/components/gp/Print";
import { BrandBadge, BrandWordmark } from "@/components/gp/Brand";
import Reveal from "./Reveal";
import type { V2Photo } from "./data";

/**
 * 6 · The house: the crowned logo badge stamps itself onto a large print of a
 * signature cake (scale + rotate settle, a gold impression ring, the print
 * takes the hit). A note from the atelier, signed with the script wordmark.
 * No portrait, no first name: the brand signs.
 */
export default async function HouseStamp({ locale, photo }: { locale: string; photo: V2Photo }) {
  const t = await getTranslations({ locale, namespace: "home.house" });
  return (
    <SectionTone tone="cream" aria-labelledby="house-title" className="py-20 md:py-32">
      <div className="gp-container grid items-center gap-14 md:grid-cols-12 md:gap-10">
        <Reveal className="hv2-house relative mx-auto w-full max-w-[min(84vw,500px)] md:col-span-6 md:mx-0 md:ms-[4%]" threshold={0.45}>
          <div className="hv2-house-print">
            <Print
              src={photo.src}
              alt={photo.alt}
              sizes="(min-width: 768px) 500px, 84vw"
              rotate={-3}
              aspect="4 / 5"
              objectPosition="50% 45%"
            />
          </div>
          <div className="absolute -end-5 -top-9 md:-end-12 md:-top-12">
            <span aria-hidden="true" className="hv2-stamp-ring absolute inset-0 rounded-full ring-2 ring-gp-gold" />
            <span className="hv2-stamp block rounded-full shadow-[0_16px_30px_-14px_rgb(var(--gp-ink)/0.6)]">
              <BrandBadge size={124} className="ring-2" alt="Gateaux Patience" />
            </span>
          </div>
        </Reveal>

        <div className="md:col-span-6 md:ps-6 lg:ps-12">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2
            id="house-title"
            className="mt-3 font-display text-step-head font-semibold leading-[1] tracking-[-0.035em] rtl:leading-[1.25] rtl:tracking-normal"
          >
            {t("title")}
          </h2>
          <div className="mt-7 max-w-[46ch] space-y-4 text-step-body leading-[1.65] text-gp-ink/80">
            <p className="text-step-lead leading-snug text-gp-ink">{t("p1")}</p>
            <p>{t("p2")}</p>
            <p>{t("p3")}</p>
          </div>
          <p className="mt-9 text-step-small font-medium text-gp-ink/70">{t("signoff")}</p>
          <BrandWordmark className="mt-2 w-[min(72vw,300px)] text-gp-raspberry" label={t("signature_aria")} />
        </div>
      </div>
    </SectionTone>
  );
}
