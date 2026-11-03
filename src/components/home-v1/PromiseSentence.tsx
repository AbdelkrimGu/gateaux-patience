import { getTranslations } from "next-intl/server";
import HandNote from "@/components/gp/HandNote";
import SectionTone from "@/components/gp/SectionTone";
import ScrollInk from "./ScrollInk";

/** 2 Â· Promises as one sentence (cream): a quiet breath after the hero. */
export default async function PromiseSentence({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.promise" });
  return (
    <SectionTone tone="cream" aria-label={t("aria")} className="py-20 md:py-32">
      <div className="gp-container flex flex-col items-center">
        <ScrollInk
          source={t.raw("sentence") as string}
          className="max-w-[23ch] text-center font-display text-[clamp(1.9rem,1.05rem+2.9vw,3.6rem)] font-medium leading-[1.12] tracking-[-0.035em] text-gp-ink md:max-w-[26ch] rtl:leading-[1.45] rtl:tracking-normal"
        />
        <HandNote rotate={-3} size="md" className="mt-10 md:mt-14">
          {t("coda")}
        </HandNote>
      </div>
    </SectionTone>
  );
}
