"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import TiramisuPreview from "./TiramisuPreview";
import type { BoxShape } from "@/lib/tiramisu-catalog";
import {
  TIRAMISU_SIZES,
  STYLE_META,
  sanitizeTiramisuLine,
  type Locale,
  type TiramisuStyle,
  type TiramisuSizeId,
} from "@/lib/tiramisu-config";

const MAX_LINES = 4;

export interface Personalization {
  style: TiramisuStyle;
  sizeId: TiramisuSizeId;
  lines: string[]; // length MAX_LINES
}

export function emptyPersonalization(): Personalization {
  return { style: "cacao", sizeId: "large", lines: Array(MAX_LINES).fill("") };
}

export function personalizationText(p: Personalization): string {
  const eff = p.style === "pieces" ? "small" : p.sizeId;
  const size = TIRAMISU_SIZES.find((s) => s.id === eff)!;
  return p.lines
    .slice(0, size.maxLines)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
    .join("\n");
}

export default function ItemCustomizer({
  initial,
  optionLabel,
  shape,
  progressLabel,
  onSave,
  onCancel,
}: {
  initial: Personalization | null;
  optionLabel: string;
  shape: BoxShape;
  /** e.g. "Boîte 2 sur 3" when walking through several boxes. */
  progressLabel?: string;
  onSave: (p: Personalization) => void;
  onCancel: () => void;
}) {
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";
  const t = (fr: string, ar: string, en: string) =>
    locale === "ar" ? ar : locale === "en" ? en : fr;

  const seed = initial ?? emptyPersonalization();
  const [style, setStyle] = useState<TiramisuStyle>(seed.style);
  const [sizeId, setSizeId] = useState<TiramisuSizeId>(seed.sizeId);
  const [lines, setLines] = useState<string[]>(() => {
    const a = [...seed.lines];
    while (a.length < MAX_LINES) a.push("");
    return a.slice(0, MAX_LINES);
  });

  const effId: TiramisuSizeId = style === "pieces" ? "small" : sizeId;
  const size = TIRAMISU_SIZES.find((s) => s.id === effId)!;
  const perLine = size.charsPerLine[style];

  const text = useMemo(
    () =>
      lines
        .slice(0, size.maxLines)
        .map((l) => l.trimEnd())
        .filter((l) => l.length > 0)
        .join("\n"),
    [lines, size.maxLines]
  );

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const focusLine = (i: number) => inputRefs.current[i]?.focus();

  function handleChange(i: number, v: string) {
    const prevLen = (lines[i] ?? "").length;
    const clean = sanitizeTiramisuLine(v, style, size).toUpperCase();
    setLines((prev) => {
      const next = [...prev];
      next[i] = clean;
      return next;
    });
    if (clean.length >= perLine && clean.length > prevLen && i < size.maxLines - 1) {
      requestAnimationFrame(() => focusLine(i + 1));
    }
  }
  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (i < size.maxLines - 1) focusLine(i + 1);
      else e.currentTarget.blur();
    }
  }
  function changeStyle(s: TiramisuStyle) {
    setStyle(s);
    const eff = s === "pieces" ? "small" : sizeId;
    const sz = TIRAMISU_SIZES.find((x) => x.id === eff)!;
    setLines((prev) => prev.map((l) => sanitizeTiramisuLine(l, s, sz).toUpperCase()));
  }
  function changeSize(id: TiramisuSizeId) {
    setSizeId(id);
    const sz = TIRAMISU_SIZES.find((x) => x.id === id)!;
    setLines((prev) => prev.map((l) => sanitizeTiramisuLine(l, style, sz).toUpperCase()));
  }

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

      {/* Preview — in the customer's actual box shape */}
      <div className="flex shrink-0 items-center justify-center px-4 pt-2">
        <div className="h-[32vh] w-[32vh] max-w-full">
          <TiramisuPreview style={style} size={size} text={text} shape={shape} />
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
                onClick={() => changeStyle(s)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-start transition-all",
                  active ? "border-rose bg-rose/5 shadow-sm" : "border-border bg-white"
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

        {/* Size (cacao only — pieces is single-mould size) */}
        {style === "pieces" ? (
          <div className="rounded-xl border border-border bg-white px-3 py-2 text-[11px] leading-snug text-charcoal-light">
            🍫 {t(
              "Lettres en chocolat blanc : une seule taille. Jusqu'à 4 lignes.",
              "حروف الشوكولاتة البيضاء: حجم واحد. حتى 4 أسطر.",
              "White-chocolate letters: one size. Up to 4 lines."
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {TIRAMISU_SIZES.map((s) => {
              const active = sizeId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => changeSize(s.id)}
                  className={cn(
                    "rounded-xl border px-2 py-1.5 text-center transition-all",
                    active ? "border-gold bg-gold/10 shadow-sm" : "border-border bg-white"
                  )}
                >
                  <span className="block text-xs font-bold text-charcoal">
                    {s.labels[locale]}
                  </span>
                  <span className="block text-[10px] text-charcoal-light">
                    {s.hint[locale]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Text lines */}
        <div className="space-y-2">
          {Array.from({ length: size.maxLines }).map((_, i) => {
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
                  enterKeyHint={i < size.maxLines - 1 ? "next" : "done"}
                  value={val}
                  maxLength={perLine}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  placeholder={
                    size.maxLines > 1
                      ? `${t("Ligne", "سطر", "Line")} ${i + 1}`
                      : t("Tapez ici…", "اكتب هنا…", "Type here…")
                  }
                  dir={isRTL ? "rtl" : "ltr"}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 pe-12 font-playfair text-base uppercase text-charcoal outline-none transition-colors focus:border-rose focus:ring-2 focus:ring-rose/20"
                />
                <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[10px] tabular-nums text-charcoal-lighter">
                  {val.length}/{perLine}
                </span>
              </div>
            );
          })}
        </div>
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
          onClick={() => onSave({ style, sizeId: effId, lines })}
          className="flex flex-[2] items-center justify-center gap-1.5 rounded-full bg-rose py-3 text-sm font-semibold text-white shadow-cake transition-all hover:bg-rose-dark active:scale-[0.98]"
        >
          <Check size={16} />
          {t("Enregistrer", "حفظ", "Save")}
        </button>
      </div>
    </div>
  );
}
