"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { BrandBadge } from "@/components/gp/Brand";
import WhatsAppIcon from "@/components/gp/WhatsAppIcon";
import { useOrderHref, WHATSAPP_DIGITS } from "@/lib/order";
import { cn } from "@/lib/utils";
import { useReveal } from "./useReveal";

type Field = "occasion" | "date" | "parts" | "flavour" | "decor";
type Errors = Partial<Record<Field, string>>;

const OTHER = "__other";
const INTL_LOCALE: Record<string, string> = { fr: "fr-FR", ar: "ar-DZ", en: "en-GB" };

function isoToday(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * 7 · "Votre message": a cream ticket printing out of a dark slot, filled in
 * like an order slip, that drafts a localized WhatsApp message. It collects
 * what to tell us (no policies) — a first sketch of the future configurator.
 */
export default function TicketForm({ occasions }: { occasions: { slug: string; label: string }[] }) {
  const t = useTranslations("home.ticket");
  const tf = useTranslations("frame");
  const locale = useLocale();
  const order = useOrderHref();
  const uid = useId();
  const [revealRef, reveal] = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const [errors, setErrors] = useState<Errors>({});
  const [sentHref, setSentHref] = useState<string | null>(null);
  // Set after mount: the server cannot know the visitor's day.
  const [today, setToday] = useState<string | undefined>(undefined);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value, read once
    setToday(isoToday());
  }, []);
  const formRef = useRef<HTMLFormElement>(null);
  const tw = useTranslations("order_wa");
  // Without JavaScript the form still opens WhatsApp with a generic message.
  const fallbackText = `${tw("hello")}\n${tw("generic")}`;

  const id = (f: Field) => `${uid}-${f}`;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (f: Field) => String(fd.get(f) ?? "").trim();
    const occasion = get("occasion");
    const date = get("date");
    const parts = get("parts");
    const next: Errors = {};

    if (!occasion) next.occasion = t("err_occasion");
    if (!date) next.date = t("err_date");
    else if (date < isoToday()) next.date = t("err_date_past");
    // A number field returns "" for letters: read badInput too.
    const partsEl = e.currentTarget.elements.namedItem("parts") as HTMLInputElement | null;
    if (partsEl?.validity.badInput || (parts && !(/^\d{1,4}$/.test(parts) && Number(parts) >= 1 && Number(parts) <= 2000))) {
      next.parts = t("err_parts");
    }
    setErrors(next);
    const firstBad = (["occasion", "date", "parts"] as Field[]).find((f) => next[f]);
    if (firstBad) {
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(firstBad))}`)?.focus();
      setSentHref(null);
      return;
    }

    const [y, m, d] = date.split("-").map(Number);
    const niceDate = new Date(y, m - 1, d).toLocaleDateString(INTL_LOCALE[locale] ?? locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const occasionLabel = occasion === OTHER ? undefined : occasions.find((o) => o.slug === occasion)?.label;
    const details = [
      ...(occasion === OTHER ? [{ label: t("occasion"), value: t("other") }] : []),
      { label: t("date"), value: niceDate },
      { label: t("parts"), value: parts },
      { label: t("flavour"), value: get("flavour") },
      { label: t("decor"), value: get("decor") },
    ];
    const href = order({ occasion: occasionLabel, details });
    setSentHref(href);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  const errorOf = (f: Field) =>
    errors[f] ? (
      <p id={`${id(f)}-err`} className="mt-1 text-end text-[0.8125rem] font-medium text-gp-raspberry">
        {errors[f]}
      </p>
    ) : null;

  const control =
    "min-h-11 w-full rounded-none border-0 border-b-2 border-gp-ink/15 bg-transparent px-0 pb-1 pt-2 text-end font-display text-[1.0625rem] font-semibold text-gp-ink placeholder:font-text placeholder:font-normal placeholder:text-gp-ink/65 focus:border-gp-raspberry aria-[invalid=true]:border-gp-raspberry";

  const row = (f: Field, label: string, input: React.ReactNode) => (
    <div className="py-1.5">
      <div className="flex items-end gap-3">
        <label
          htmlFor={id(f)}
          className="shrink-0 pb-2.5 text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-gp-ink/70 sm:tracking-[0.14em] rtl:normal-case rtl:tracking-normal rtl:text-[0.9375rem]"
        >
          {label}
        </label>
        <span aria-hidden="true" className="mb-[0.9rem] min-w-4 flex-1 border-b-2 border-dotted border-gp-ink/25" />
        <div className="relative w-[54%] shrink-0 sm:w-[50%]">{input}</div>
      </div>
      {errorOf(f)}
    </div>
  );

  const aria = (f: Field) => ({
    id: id(f),
    name: f,
    "aria-invalid": errors[f] ? true : undefined,
    "aria-describedby": errors[f] ? `${id(f)}-err` : undefined,
  });

  return (
    <div ref={revealRef} data-reveal={reveal} className="hv2-ticket-wrap relative mx-auto w-full max-w-[540px]">
      {/* The slot */}
      <div
        aria-hidden="true"
        className="relative z-10 flex h-6 items-center rounded-full bg-gp-ink px-[3.5%] ring-1 ring-gp-gold/45"
      >
        <span className="h-1.5 w-full rounded-full bg-gp-cream/10" />
      </div>
      <div className="-mt-2.5 overflow-hidden px-[4%] pb-6">
        <form
          ref={formRef}
          noValidate
          data-tone="cream"
          action={`https://wa.me/${WHATSAPP_DIGITS}`}
          method="get"
          target="_blank"
          onSubmit={onSubmit}
          aria-labelledby="ticket-title"
          className="hv2-ticket hv2-ticket-edge relative bg-gp-cream px-6 pb-12 pt-10 text-gp-ink md:px-9"
        >
          <div className="flex flex-col items-center text-center">
            <BrandBadge size={52} />
            <p className="mt-3 font-display text-[0.9375rem] font-semibold uppercase tracking-[0.32em]" dir="ltr">
              Gateaux Patience
            </p>
            <p className="mt-1 text-step-small text-gp-ink/70">{t("ticket_sub")}</p>
          </div>
          <div aria-hidden="true" className="my-6 border-t-2 border-dashed border-gp-ink/20" />
          <input type="hidden" name="text" value={fallbackText} />

          {row(
            "occasion",
            t("occasion"),
            <>
              <select {...aria("occasion")} aria-required="true" defaultValue="" className={cn(control, "appearance-none pe-6 [text-align-last:end]")}>
                <option value="" disabled>
                  {t("choose")}
                </option>
                {occasions.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.label}
                  </option>
                ))}
                <option value={OTHER}>{t("other")}</option>
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute end-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gp-ink/50" />
            </>
          )}
          {row(
            "date",
            t("date"),
            <input {...aria("date")} aria-required="true" type="date" min={today} className={cn(control, "[color-scheme:light]")} />
          )}
          {row(
            "parts",
            t("parts"),
            <input
              {...aria("parts")}
              type="number"
              inputMode="numeric"
              min={1}
              max={2000}
              placeholder={t("parts_placeholder")}
              className={cn(control, "tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none")}
            />
          )}
          {row(
            "flavour",
            t("flavour"),
            <input {...aria("flavour")} type="text" maxLength={80} autoComplete="off" placeholder={t("flavour_placeholder")} className={control} />
          )}
          {row(
            "decor",
            t("decor"),
            <input {...aria("decor")} type="text" maxLength={120} autoComplete="off" placeholder={t("decor_placeholder")} className={control} />
          )}

          <div aria-hidden="true" className="my-6 border-t-2 border-dashed border-gp-ink/20" />
          <button
            type="submit"
            className="inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full bg-gp-raspberry px-6 text-[1rem] font-semibold text-gp-cream shadow-gp-chip transition-transform duration-150 ease-gp active:scale-[0.98]"
          >
            <WhatsAppIcon className="h-5 w-5 shrink-0" />
            {t("submit")}
            <span className="sr-only"> ({tf("opens_whatsapp")})</span>
          </button>
          <p className="mt-3 text-center text-step-small text-gp-ink/70">{t("hint")}</p>
          <div role="status" aria-live="polite" className="text-center">
            {sentHref ? (
              <p className="mt-3 text-step-small font-medium text-gp-ink">
                {t("sent")}{" "}
                <a href={sentHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-gp-raspberry underline">
                  {t("open_again")}
                </a>
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
