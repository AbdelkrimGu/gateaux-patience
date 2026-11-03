import { getTranslations } from "next-intl/server";
import SectionTone from "@/components/gp/SectionTone";
import Eyebrow from "@/components/gp/Eyebrow";
import HandNote from "@/components/gp/HandNote";
import TicketForm from "./TicketForm";

/** 7 · "Votre message": the ticket builder on cocoa-ink. */
export default async function TicketSection({
  locale,
  occasions,
}: {
  locale: string;
  occasions: { slug: string; label: string }[];
}) {
  const t = await getTranslations({ locale, namespace: "home.ticket" });
  return (
    // data-final-cta: the phone sticky order pill hides here (it covered the
    // submit button, and tapping it would drop what was typed).
    <SectionTone tone="ink" aria-labelledby="ticket-title" data-final-cta className="py-20 md:py-32">
      <div className="gp-container grid gap-12 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-5 md:pt-16">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2
            id="ticket-title"
            className="mt-3 font-display text-step-head font-semibold leading-[1] tracking-[-0.035em] rtl:leading-[1.25] rtl:tracking-normal"
          >
            {t("title")}
          </h2>
          <p className="mt-5 max-w-[40ch] text-step-lead leading-snug text-gp-cream/75">{t("lead")}</p>
          <HandNote size="md" rotate={-5} arrow="below-end" className="mt-8 hidden md:inline-flex">
            {t("note")}
          </HandNote>
        </div>
        <div className="md:col-span-7">
          <TicketForm occasions={occasions} />
        </div>
      </div>
    </SectionTone>
  );
}
