"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import TiramisuPreview from "./TiramisuPreview";
import { computeLayout } from "@/lib/tiramisu-layout";
import {
  resolveTemplate,
  type BoxShape,
  type TiramisuSizeId,
} from "@/lib/tiramisu-templates";
import {
  STYLE_META,
  cleanTiramisuLine,
  type Locale,
  type TiramisuStyle,
} from "@/lib/tiramisu-config";

export interface Personalization {
  style: TiramisuStyle;
  sizeId: TiramisuSizeId;
  lines: string[];
}

export function emptyPersonalization(sizeId: TiramisuSizeId = "large"): Personalization {
  return { style: "cacao", sizeId, lines: [] };
}

/** The message as text (non-empty lines only). Decoupled from any size config. */
export function personalizationText(p: Personalization): string {
  return p.lines
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
    .join("\n");
}

export default function ItemCustomizer({
  initial,
  optionLabel,
  shape,
  sizeId,
  progressLabel,
  onSave,
  onCancel,
}: {
  initial: Personalization | null;
  optionLabel: string;
  shape: BoxShape;
  /** The box's size (its catalog category) — fixes the product template. */
  sizeId: TiramisuSizeId;
  /** e.g. "Boîte 2 sur 3" when walking through several boxes. */
  progressLabel?: string;
  onSave: (p: Personalization) => void;
  onCancel: () => void;
}) {
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";
  const t = (fr: string, ar: string, en: string) =>
    locale === "ar" ? ar : locale === "en" ? en : fr;

  // The product template is fully determined by the box (shape × size).
  const template = useMemo(() => resolveTemplate(shape, sizeId), [shape, sizeId]);
  const maxLines = template.lineRules.maxLines;
  const perLine = template.lineRules.maxCharsPerLine;

  const seed = initial ?? emptyPersonalization(sizeId);
  const [style, setStyle] = useState<TiramisuStyle>(seed.style);
  const [lines, setLines] = useState<string[]>(() => {
    const a = seed.lines.map((l) => cleanTiramisuLine(l).slice(0, perLine));
    while (a.length < maxLines) a.push("");
    return a.slice(0, maxLines);
  });

  const text = useMemo(
    () =>
      lines
        .map((l) => l.trimEnd())
        .filter((l) => l.length > 0)
        .join("\n"),
    [lines]
  );

  // Live fit feedback straight from the layout engine (never silently drops).
  const layout = useMemo(
    () => computeLayout(template, text, style),
    [template, text, style]
  );

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const focusLine = (i: number) => inputRefs.current[i]?.focus();

  function handleChange(i: number, v: string) {
    const prevLen = (lines[i] ?? "").length;
    const clean = cleanTiramisuLine(v).slice(0, perLine);
    setLines((prev) => {
      const next = [...prev];
      next[i] = clean;
      return next;
    });
    if (clean.length >= perLine && clean.length > prevLen && i < maxLines - 1) {
      requestAnimationFrame(() => focusLine(i + 1));
    }
  }
  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (i < maxLines - 1) focusLine(i + 1);
      else e.currentTarget.blur();
    }
  }

  const styleLabel = t(
    "Petit conseil : plus le texte est court, plus les lettres sont grandes et belles.",
    "نصيحة: كلما كان النص أقصر، كانت الحروف أكبر وأجمل.",
    "Tip: the shorter the text, the larger and more beautiful the letters."
  );

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="flex h-full flex-col">
      {/* Progress (when walking through several boxes) */}
      {progressLabel && (
        <div className="flex shrink-0 justify-center pt-1.5">
          <span className="rounded-full bg-rose/10 px-3 py-1 text-[11px] font-semibold text-rose">
            {progressLabel}
          </span>
        </div>
      )}

      {/* Preview — in the customer's actual box shape + size */}
      <div className="flex shrink-0 items-center justify-center px-4 pt-2">
        <div className="h-[32vh] w-[32vh] max-w-full">
          <TiramisuPreview style={style} template={template} text={text} />
        </div>
      </div>

      {/* Controls — all on screen */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2 pt-3">
        <p className="text-center text-xs font-medium text-charcoal-light">
          {t("Personnalisation de", "تخصيص", "Personalizing")}{" "}
          <span className="text-rose">{optionLabel}</span>
        </p>

        {/* Style */}
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(STYLE_META) as TiramisuStyle[]).map((s) => {
            const active = style === s;
            return (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-start transition-all",
                  active ? "border-rose bg-rose/5 shadow-xs" : "border-border bg-white"
                )}
              >
                <span className="text-lg">{STYLE_META[s].emoji}</span>
                <span className="ms-1 text-xs font-semibold text-charcoal">
                  {STYLE_META[s].labels[locale]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-white px-3 py-2 text-[11px] leading-snug text-charcoal-light">
          💡 {styleLabel}
        </div>

        {/* Text lines */}
        <div className="space-y-2">
          {Array.from({ length: maxLines }).map((_, i) => {
            const val = lines[i] ?? "";
            return (
              <div key={i} className="relative">
                <input
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  enterKeyHint={i < maxLines - 1 ? "next" : "done"}
                  value={val}
                  maxLength={perLine}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  placeholder={
                    maxLines > 1
                      ? `${t("Ligne", "سطر", "Line")} ${i + 1}`
                      : t("Tapez ici…", "اكتب هنا…", "Type here…")
                  }
                  dir={isRTL ? "rtl" : "ltr"}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 pe-12 font-playfair text-base uppercase text-charcoal outline-hidden transition-colors focus:border-rose focus:ring-2 focus:ring-rose/20"
                />
                <span className="pointer-events-none absolute inset-e-3 top-1/2 -translate-y-1/2 text-[10px] tabular-nums text-charcoal-lighter">
                  {val.length}/{perLine}
                </span>
              </div>
            );
          })}
        </div>

        {/* Gentle fit warning (does not block saving) */}
        {!layout.fits && text.length > 0 && (
          <div className="flex items-start gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-[11px] leading-snug text-charcoal">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-gold" />
            <span>
              {t(
                "Ce message est un peu long pour cette boîte — les lettres seront plus petites.",
                "هذه الرسالة طويلة قليلاً على هذه العلبة — ستكون الحروف أصغر.",
                "This message is a little long for this box — the letters will be smaller."
              )}
            </span>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex shrink-0 gap-3 border-t border-border bg-white px-4 py-3">
        <button
          onClick={onCancel}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border py-3 text-sm font-medium text-charcoal-light transition-colors hover:border-charcoal-light"
        >
          <X size={16} />
          {t("Annuler", "إلغاء", "Cancel")}
        </button>
        <button
          onClick={() => onSave({ style, sizeId, lines })}
          className="flex flex-2 items-center justify-center gap-1.5 rounded-full bg-rose py-3 text-sm font-semibold text-white shadow-cake transition-all hover:bg-rose-dark active:scale-[0.98]"
        >
          <Check size={16} />
          {t("Enregistrer", "حفظ", "Save")}
        </button>
      </div>
    </div>
  );
}
