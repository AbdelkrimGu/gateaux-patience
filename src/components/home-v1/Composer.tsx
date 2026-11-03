"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/gp/WhatsAppIcon";
import { WHATSAPP_DIGITS, useOrderHref } from "@/lib/order";
import { cn } from "@/lib/utils";

/**
 * 9 · The WhatsApp composer: type a message (or pick an occasion to prefill
 * it), send → WhatsApp opens with the greeting + the text, localized, trimmed.
 * Without JS the form still posts `text` to wa.me (GET), so it never dead-ends.
 */
export default function Composer({ occasions }: { occasions: string[] }) {
  const t = useTranslations("home.finale");
  const tf = useTranslations("frame");
  const tw = useTranslations("order_wa");
  const order = useOrderHref();
  const id = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const href = order(text.trim() ? { text } : picked ? { occasion: picked } : {});
    // Same tab: in-app browsers (Instagram, Facebook) ignore window.open popups,
    // and wa.me hands over to the WhatsApp app anyway.
    window.location.assign(href);
  };

  const pick = (label: string) => {
    setPicked(label);
    setText(tw("occasion", { occasion: label }));
    input.current?.focus();
  };

  return (
    <div>
      <form
        action={`https://wa.me/${WHATSAPP_DIGITS}`}
        method="get"
        onSubmit={submit}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2 sm:rounded-[30px] sm:bg-gp-cream sm:p-2 sm:shadow-[0_24px_50px_-24px_rgb(var(--gp-ink)/0.55)]"
      >
        <label htmlFor={id} className="sr-only">
          {t("field_label")}
        </label>
        <textarea
          ref={input}
          id={id}
          name="text"
          rows={2}
          maxLength={500}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (!e.target.value) setPicked(null);
          }}
          placeholder={t("placeholder")}
          className="min-h-[4.5rem] w-full flex-1 resize-none rounded-[24px] bg-gp-cream px-5 py-4 text-[1rem] leading-snug text-gp-ink shadow-[0_24px_50px_-24px_rgb(var(--gp-ink)/0.55)] outline-none placeholder:text-gp-ink/60 focus-visible:ring-2 focus-visible:ring-gp-ink sm:min-h-[3.5rem] sm:rounded-[22px] sm:bg-transparent sm:py-3.5 sm:shadow-none"
        />
        <button
          type="submit"
          className="group inline-flex min-h-14 shrink-0 items-center justify-center gap-2.5 rounded-full bg-gp-ink px-6 text-[1rem] font-semibold text-gp-cream transition-transform duration-150 ease-gp active:scale-[0.97] sm:min-h-[3.25rem]"
        >
          <WhatsAppIcon className="h-5 w-5" />
          {t("send")}
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 ease-gp group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
          />
          <span className="sr-only"> ({tf("opens_whatsapp")})</span>
        </button>
      </form>

      <p className="mt-8 text-step-small font-semibold uppercase tracking-[0.18em] text-gp-cream/85 rtl:normal-case rtl:tracking-normal">
        {t("pills_label")}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2.5">
        {occasions.map((label) => (
          <li key={label}>
            <button
              type="button"
              aria-pressed={picked === label}
              onClick={() => pick(label)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-5 text-[0.9375rem] font-semibold ring-1 ring-inset transition-colors duration-150",
                picked === label
                  ? "bg-gp-cream text-gp-raspberry ring-gp-cream"
                  : "bg-gp-cream/10 text-gp-cream ring-gp-cream/45 hover:bg-gp-cream/20"
              )}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
