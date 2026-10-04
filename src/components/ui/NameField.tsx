"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { hasArabic } from "./script";

/*
  Name field (B §7): white pill holding a label and a dragée inner pill whose
  text is set in the display face, framboise, max 14 characters.
  Controlled: the parent owns the value and feeds it to <LetteredBoard name>,
  the tiramisu tile and buildWhatsAppUrl({ name }).

  <NameField value={name} onChange={setName}
             label={t("common.name_field.label")}            // translate on the
             placeholder={t("common.name_field.placeholder")} />  // server, pass down
  <NameField … tone="ecrin" />   on the dark écrin surface (wedding detail)

  Script, not page locale, drives the typography: an Arabic name typed on a
  FR/EN page is tagged lang="ar" and set in Lalezar, untracked, like the ring.
*/

export const NAME_MAX = 14;

/** Lalezar first for Arabic runs on any locale (see LetteredBoard.module.css). */
const ARABIC_DISPLAY = "var(--font-display-ar, var(--font-lalezar, gp-none)), var(--font-display)";

export interface NameFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** common.name_field.label, translated by the (server) parent. */
  label: string;
  /** common.name_field.placeholder */
  placeholder: string;
  maxLength?: number;
  id?: string;
  className?: string;
  /** "ecrin": sucre-6% pill + copper bezel and copper lettering, for paillette. */
  tone?: "sucre" | "ecrin";
  /** Submit on Enter (e.g. open WhatsApp). Optional. */
  onSubmit?: () => void;
}

export function NameField({
  value,
  onChange,
  label,
  placeholder,
  maxLength = NAME_MAX,
  id,
  className,
  tone = "sucre",
  onSubmit,
}: NameFieldProps) {
  const autoId = useId();
  const inputId = id ?? `name-${autoId}`;
  const arabic = hasArabic(value);
  const ecrin = tone === "ecrin";

  return (
    <form
      className={cn(
        "flex items-center gap-3 rounded-pill py-1.5 ps-5 pe-1.5",
        ecrin ? "bezel bg-sucre/[0.06]" : "bg-white shadow-[inset_0_0_0_1.5px_var(--color-hairline)]",
        className
      )}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <label
        htmlFor={inputId}
        className={cn("type-meta shrink-0 whitespace-nowrap", ecrin ? "text-sucre/80" : "text-ink-muted")}
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        enterKeyHint="done"
        dir="auto"
        lang={arabic ? "ar" : undefined}
        style={arabic ? { fontFamily: ARABIC_DISPLAY } : undefined}
        onChange={(e) => onChange(e.target.value.replace(/[\r\n]/g, "").slice(0, maxLength))}
        className={cn(
          "h-11 w-full min-w-0 flex-1 rounded-pill px-4 font-display text-lg leading-none focus:outline-none",
          arabic ? "text-[22px] tracking-normal" : "tracking-[0.02em] [&:lang(ar)]:text-[22px] [&:lang(ar)]:tracking-normal",
          ecrin
            ? "bg-paillette text-cuivre shadow-[inset_0_0_0_1px_rgb(196_134_74/0.35)] placeholder:text-cuivre/70 focus-visible:shadow-[0_0_0_2px_var(--color-dragee)]"
            : "bg-dragee text-framboise placeholder:text-framboise/60 focus-visible:shadow-[0_0_0_2px_var(--color-framboise)]"
        )}
      />
    </form>
  );
}
