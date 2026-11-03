import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { BrandWordmark } from "@/components/gp/Brand";
import Eyebrow from "@/components/gp/Eyebrow";
import SectionTone from "@/components/gp/SectionTone";
import { CONTACT } from "@/lib/constants";
import Envelope from "./Envelope";

/**
 * 5 · "Un mot de la maison" (champagne). No portrait, no first name: a letter
 * from the atelier, signed with the logo's script wordmark, coming out of a
 * raspberry envelope sealed with a gold crown.
 */
export default async function HouseNote({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.house" });

  const letter = (
    <>
      <p className="font-note text-[2rem] font-semibold leading-none text-gp-raspberry md:text-[2.3rem] rtl:text-[1.7rem] rtl:leading-[1.4]">
        {t("greeting")}
      </p>
      <div className="mt-4 space-y-3 text-[1rem] leading-[1.6] text-gp-ink/80 md:text-[1.0625rem] rtl:leading-[1.8]">
        <p>{t("p1")}</p>
        <p>{t("p2")}</p>
        <p>{t("p3")}</p>
      </div>
      <p className="mt-5 text-[0.9375rem] text-gp-ink/70">{t("signoff")}</p>
    </>
  );

  return (
    <SectionTone tone="champagne" aria-labelledby="house-title" className="overflow-x-clip">
      <div className="gp-container grid gap-12 py-20 md:grid-cols-12 md:gap-8 md:py-32">
        <div className="md:sticky md:top-32 md:col-span-5 md:self-start md:pt-10 lg:col-span-4">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2
            id="house-title"
            className="mt-3 font-display text-step-head font-semibold leading-[1] tracking-[-0.035em] rtl:leading-[1.25] rtl:tracking-normal"
          >
            {t("title")}
          </h2>
          <p className="mt-5 max-w-[34ch] text-step-body leading-relaxed text-tone-muted">{t("lead")}</p>
          <a
            href={CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium underline decoration-gp-ink/30 underline-offset-[6px] transition-colors hover:decoration-gp-ink"
          >
            {t("instagram")}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4 rtl:-scale-x-100" />
          </a>
        </div>
        <div className="md:col-span-7 md:col-start-6 lg:col-start-6">
          <Envelope
            letter={letter}
            signature={
              <BrandWordmark
                label="Gateaux Patience"
                className="w-[11rem] text-gp-raspberry md:w-[13rem]"
              />
            }
          />
        </div>
      </div>
    </SectionTone>
  );
}
