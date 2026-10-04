"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EcrinSurface } from "@/components/ui/EcrinSurface";
import TiramisuPreview from "./TiramisuPreview";
import { TIcon } from "./TiramisuIcon";
import { useTiramisuUi, fmt } from "./ui-context";
import { computeLayout } from "@/lib/tiramisu-layout";
import {
  resolveTemplate,
  type BoxShape,
  type TiramisuSizeId,
} from "@/lib/tiramisu-templates";
import {
  STYLE_META,
  cleanTiramisuLine,
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
  const { locale, ui } = useTiramisuUi();
  const isRTL = locale === "ar";

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

  const styles = Object.keys(STYLE_META) as TiramisuStyle[];

  return (
    <div className="flex h-full flex-col">
      {/* The stage: preview on the écrin surface, in the box's real shape + size. */}
      <EcrinSurface className="mx-4 mt-1 flex shrink-0 flex-col items-center gap-3 rounded-[32px] px-3 pt-3 pb-3 desk:mx-6">
        {progressLabel && (
          <p className="text-[13px] font-medium text-cuivre" aria-live="polite">
            {progressLabel}
          </p>
        )}
        <TiramisuPreview style={style} template={template} text={text} />
      </EcrinSurface>

      {/* Controls */}
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4 pt-3.5 pb-3 desk:px-6">
        <h2 className="type-meta text-ink-muted">
          {ui.custom.personalizing} <span className="font-semibold text-paillette">{optionLabel}</span>
        </h2>

        {/* Decoration style */}
        <div role="radiogroup" aria-label={ui.custom.style} className="grid grid-cols-2 gap-2">
          {styles.map((st) => {
            const active = style === st;
            return (
              <button
                key={st}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setStyle(st)}
                className={cn(
                  "press flex min-h-[52px] items-center gap-2.5 rounded-[18px] px-3 py-2 text-start text-[14px] font-medium leading-tight",
                  active
                    ? "bg-paillette text-sucre"
                    : "bg-white shadow-[inset_0_0_0_1.5px_var(--color-hairline)] hover:shadow-[inset_0_0_0_1.5px_var(--color-paillette)]"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-5 shrink-0 rounded-full",
                    st === "cacao" ? "bg-cacao" : "bg-white shadow-[inset_0_0_0_1.5px_var(--color-cacao)]",
                    active && "ring-2 ring-sucre/70"
                  )}
                />
                {STYLE_META[st].labels[locale]}
              </button>
            );
          })}
        </div>

        <p className="type-meta flex items-start gap-2 text-ink-muted">
          <TIcon name="info" size={17} className="mt-px" />
          {ui.custom.tip}
        </p>

        {/* Text lines (Latin letters only: the product's letter set) */}
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
                  autoComplete="off"
                  spellCheck={false}
                  enterKeyHint={i < maxLines - 1 ? "next" : "done"}
                  value={val}
                  maxLength={perLine}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  aria-label={fmt(ui.custom.line_aria, { n: i + 1 })}
                  aria-describedby={`gp-count-${i}`}
                  placeholder={maxLines > 1 ? fmt(ui.custom.line, { n: i + 1 }) : ui.custom.type_here}
                  dir={isRTL ? "rtl" : "ltr"}
                  className="h-14 w-full rounded-[18px] bg-white pe-16 ps-4 font-display text-[20px] uppercase tracking-[0.04em] text-paillette shadow-[inset_0_0_0_1.5px_var(--color-hairline)] placeholder:font-sans placeholder:text-[16px] placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-muted/70"
                />
                <span
                  id={`gp-count-${i}`}
                  className="pointer-events-none absolute inset-e-4 top-1/2 -translate-y-1/2 text-[12px] font-medium tabular-nums text-ink-muted"
                >
                  <span aria-hidden="true" className="ltr">
                    {val.length}/{perLine}
                  </span>
                  <span className="sr-only">{fmt(ui.custom.count, { n: val.length, max: perLine })}</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Gentle fit warning (does not block saving) */}
        {!layout.fits && text.length > 0 && (
          <p role="status" className="type-meta flex items-start gap-2 rounded-[16px] bg-dragee px-3.5 py-2.5 text-paillette">
            <TIcon name="alert" size={17} className="mt-px text-framboise" />
            {ui.custom.too_long}
          </p>
        )}
      </div>

      {/* Footer actions (thumb zone) */}
      <div className="flex shrink-0 gap-2.5 bg-sucre px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-1px_0_var(--color-hairline)] desk:px-6">
        <Button variant="ghost" onClick={onCancel} className="flex-1 px-4">
          {ui.custom.cancel}
        </Button>
        <Button onClick={() => onSave({ style, sizeId, lines })} className="flex-2">
          <span className="inline-flex items-center gap-2">
            <Icon name="check" size={20} />
            {ui.custom.save}
          </span>
        </Button>
      </div>
    </div>
  );
}
