"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import WhatsAppIcon from "@/components/gp/WhatsAppIcon";
import Eyebrow from "@/components/gp/Eyebrow";
import OutlinedNumeral from "@/components/gp/OutlinedNumeral";
import { cn } from "@/lib/utils";

const STEP = 100;

export interface HowSliderProps {
  eyebrow: string;
  title: string;
  hint: string;
  sliderLabel: string;
  steps: { title: string; text: string; valueText: string; buttonLabel: string }[];
  photos: { src: string; alt: string }[];
  /** Optimized URL of the round cake photo used as the thumb. */
  thumb: string;
  chosen: { src: string; title: string; label: string };
  whatsapp: { label: string; lines: string[] };
  chips: string[];
  sticker: string;
}

/**
 * 5 · "Slide through it": drag the round cake along the scrubber (or press a
 * step number, or use the arrow keys) to walk through the four steps. Native
 * range input = keyboard + screen reader support for free; RTL runs right to
 * left. Not scroll-pinned.
 */
export default function HowSlider(props: HowSliderProps) {
  const { steps, photos } = props;
  const max = (steps.length - 1) * STEP;
  const rtl = useLocale() === "ar";
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);
  const raf = useRef(0);
  const pointerDown = useRef(false);
  const step = Math.min(steps.length - 1, Math.round(value / STEP));

  const set = (v: number) => {
    valueRef.current = v;
    setValue(v);
  };

  const glideTo = (target: number) => {
    cancelAnimationFrame(raf.current);
    const from = valueRef.current;
    if (from === target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return set(target);
    const t0 = performance.now();
    const ms = 420;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      set(Math.round(from + (target - from) * e));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const snap = () => glideTo(Math.round(valueRef.current / STEP) * STEP);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const cur = Math.round(valueRef.current / STEP);
    const fwd = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    let next: number | null = null;
    if (e.key === fwd || e.key === "ArrowUp" || e.key === "PageUp") next = cur + 1;
    else if (e.key === back || e.key === "ArrowDown" || e.key === "PageDown") next = cur - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = steps.length - 1;
    if (next === null) return;
    e.preventDefault();
    glideTo(Math.max(0, Math.min(steps.length - 1, next)) * STEP);
  };

  const pct = (value / max) * 100;
  const card = <BubbleCard step={step} {...props} />;

  return (
    <div className="grid md:min-h-[min(100svh,880px)] md:grid-cols-2">
      <div className="flex flex-col justify-between px-4 py-16 sm:px-8 md:px-12 md:py-24 lg:px-16">
        <div>
          <Eyebrow className="text-tone-fg/85">{props.eyebrow}</Eyebrow>
          <h2 id="how-title" className="sr-only">
            {props.title}
          </h2>
          {/* Stable live region; only its content is re-keyed (re-animated). */}
          <div aria-live="polite">
            <div key={step} className="hv2-step-in">
              <p className="mt-5 flex items-baseline gap-3 font-display text-step-head font-semibold leading-[1.02] tracking-[-0.03em] rtl:leading-[1.3] rtl:tracking-normal">
                <span className="tabular text-[0.5em] font-medium text-tone-fg/80 md:hidden">
                  {String(step + 1).padStart(2, "0")}
                </span>
                {steps[step].title}
              </p>
              <p className="mt-5 max-w-[38ch] text-step-body leading-[1.55] text-tone-fg/85">{steps[step].text}</p>
            </div>
          </div>
        </div>

        {/* Desktop: the big outlined step number fills the panel. */}
        <div aria-hidden="true" className="hidden flex-1 items-center md:flex">
          <OutlinedNumeral
            key={step}
            value={step + 1}
            stroke="cream"
            className="hv2-step-in text-[clamp(8rem,14vw,13rem)] tracking-[-0.04em]"
          />
        </div>

        {/* Phones: the photo + card inside the panel */}
        <div className="relative mt-8 aspect-[5/4] overflow-hidden rounded-[24px] md:hidden">
          <StepPhotos photos={photos} step={step} sizes="92vw" />
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">{card}</div>
        </div>

        <div className="mt-10 md:mt-12">
          <div className="flex justify-between" role="group" aria-label={props.sliderLabel}>
            {steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => glideTo(i * STEP)}
                aria-label={s.buttonLabel}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "tabular inline-flex h-11 w-14 items-center justify-center rounded-full text-step-small font-semibold transition-colors duration-150",
                  i === step ? "text-tone-fg" : "text-tone-fg/80 hover:text-tone-fg"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={max}
            step={1}
            value={value}
            aria-label={props.sliderLabel}
            aria-valuetext={steps[step].valueText}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (pointerDown.current) {
                cancelAnimationFrame(raf.current);
                set(v); // dragging: follow the finger
              } else {
                // Assistive tech nudges (iOS +1, Android %): move a whole step.
                const to = (v > valueRef.current ? Math.ceil : Math.floor)(v / STEP) * STEP;
                glideTo(Math.max(0, Math.min(max, to)));
              }
            }}
            onPointerDown={() => {
              pointerDown.current = true;
            }}
            onPointerUp={() => {
              pointerDown.current = false;
              snap();
            }}
            onPointerCancel={() => {
              pointerDown.current = false;
              snap();
            }}
            onBlur={snap}
            onKeyDown={onKeyDown}
            className="hv2-range mt-1 block h-14 w-full cursor-grab active:cursor-grabbing"
            style={{ "--p": `${pct}%`, "--thumb": `url("${props.thumb}")` } as React.CSSProperties}
          />
          <p className="mt-3 text-step-small text-tone-fg/85">{props.hint}</p>
        </div>
      </div>

      {/* Desktop: the photo side */}
      <div className="relative hidden overflow-hidden md:block">
        <StepPhotos photos={photos} step={step} sizes="50vw" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gp-ink/50 via-transparent to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 flex justify-center p-10 pb-16 lg:pb-20">{card}</div>
      </div>
    </div>
  );
}

function StepPhotos({ photos, step, sizes }: { photos: { src: string; alt: string }[]; step: number; sizes: string }) {
  return (
    <>
      {photos.map((p, i) =>
        // Only the current step and its neighbours are mounted (and loaded).
        Math.abs(i - step) > 1 ? null : (
        <Image
          key={p.src}
          src={p.src}
          alt={i === step ? p.alt : ""}
          fill
          sizes={sizes}
          className={cn(
            "object-cover transition-opacity duration-500 ease-gp",
            i === step ? "opacity-100" : "opacity-0"
          )}
          style={{ objectPosition: "50% 45%" }}
        />
        )
      )}
    </>
  );
}

/** The floating card on the photo: what each step looks like in real life. */
function BubbleCard({ step, chosen, whatsapp, chips, sticker }: HowSliderProps & { step: number }) {
  return (
    <div key={step} className="hv2-bubble w-full max-w-[340px]" aria-hidden="true">
      {step === 0 ? (
        <div className="flex items-center gap-3 rounded-[22px] bg-gp-cream p-2.5 pe-5 text-gp-ink shadow-[0_18px_40px_-20px_rgb(var(--gp-ink)/0.6)]">
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-gp-champagne">
            <Image src={chosen.src} alt="" fill sizes="56px" className="object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block text-[0.75rem] font-medium uppercase tracking-[0.14em] text-gp-ink/70 rtl:normal-case rtl:tracking-normal">
              {chosen.label}
            </span>
            <span className="block truncate font-display text-[1.05rem] font-semibold">{chosen.title}</span>
          </span>
          <span className="ms-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gp-raspberry text-gp-cream">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 8.5l3 3 6-7" />
            </svg>
          </span>
        </div>
      ) : step === 1 ? (
        <div className="rounded-[22px] bg-gp-cream p-3 text-gp-ink shadow-[0_18px_40px_-20px_rgb(var(--gp-ink)/0.6)]">
          <p className="flex items-center gap-1.5 px-1 text-[0.75rem] font-semibold text-gp-ink/70">
            <WhatsAppIcon className="h-3.5 w-3.5 text-gp-raspberry" />
            {whatsapp.label}
          </p>
          <p className="mt-2 rounded-[16px] rounded-se-[4px] bg-gp-raspberry/10 px-4 py-3 text-[0.9375rem] leading-snug">
            {whatsapp.lines.map((l, i) => (
              <span key={i} className="block">
                {l}
              </span>
            ))}
          </p>
        </div>
      ) : step === 2 ? (
        <div className="flex flex-wrap justify-center gap-2 rounded-[22px] bg-gp-cream p-3 shadow-[0_18px_40px_-20px_rgb(var(--gp-ink)/0.6)]">
          {chips.map((c, i) => (
            <span
              key={c}
              className={cn(
                "inline-flex min-h-9 items-center rounded-full px-4 text-[0.875rem] font-semibold",
                i === 1 ? "bg-gp-raspberry text-gp-cream" : "bg-gp-champagne text-gp-ink"
              )}
            >
              {c}
            </span>
          ))}
        </div>
      ) : (
        <div className="flex justify-center">
          <span className="inline-flex h-28 w-28 -rotate-6 items-center justify-center rounded-full bg-gp-raspberry p-3 text-center font-note text-[1.6rem] font-bold leading-[1] text-gp-cream shadow-[0_18px_40px_-16px_rgb(var(--gp-ink)/0.7)] ring-4 ring-gp-cream">
            {sticker}
          </span>
        </div>
      )}
    </div>
  );
}
