"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/*
  Name field (B §7): white pill holding a label and a dragée inner pill whose
  text is set in the display face, framboise, max 14 characters.
  Controlled: the parent owns the value and feeds it to <LetteredBoard name>,
  the tiramisu tile and buildWhatsAppUrl({ name }).

  <NameField value={name} onChange={setName}
             label={t("common.name_field.label")}            // translate on the
             placeholder={t("common.name_field.placeholder")} />  // server, pass down
*/

export const NAME_MAX = 14;

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
  onSubmit,
}: NameFieldProps) {
  const autoId = useId();
  const inputId = id ?? `name-${autoId}`;

  return (
    <form
      className={cn(
        "flex items-center gap-3 rounded-pill bg-white py-1.5 ps-5 pe-1.5 shadow-[inset_0_0_0_1.5px_var(--color-hairline)]",
        className
      )}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <label htmlFor={inputId} className="type-meta shrink-0 whitespace-nowrap text-ink-muted">
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
        onChange={(e) => onChange(e.target.value.replace(/[\r\n]/g, "").slice(0, maxLength))}
        className={cn(
          "h-11 w-full min-w-0 flex-1 rounded-pill bg-dragee px-4 font-display text-lg leading-none tracking-[0.02em] text-framboise",
          "placeholder:text-framboise/60 focus:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-framboise)]",
          "[&:lang(ar)]:text-[22px] [&:lang(ar)]:tracking-normal"
        )}
      />
    </form>
  );
}
