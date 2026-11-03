"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useMotionValueEvent, useScroll, type MotionValue } from "motion/react";
import Eyebrow from "@/components/gp/Eyebrow";
import HandNote from "@/components/gp/HandNote";
import OutlinedNumeral from "@/components/gp/OutlinedNumeral";
import { useReducedMotionSafe } from "@/components/gp/hooks";
import { cn } from "@/lib/utils";
import { OrderScreen, Phone, type ScreenLabels, type StoryPhotos } from "./OrderScreens";

export interface StoryStep {
  title: string;
  text: string;
}

/**
 * 6 · Desktop "watch an order": a tall ink section with a sticky stage; the
 * scroll position picks the step (outlined numeral, title, text, segmented
 * progress) and the phone shows that step's screen. Reduced motion: the same
 * stage, steps still follow the scroll but swap without animation.
 */
export default function WatchOrderScrub({
  eyebrow,
  title,
  steps,
  inspiration,
  photos,
  labels,
}: {
  eyebrow: string;
  title: string;
  steps: StoryStep[];
  inspiration: string;
  photos: StoryPhotos;
  labels: ScreenLabels;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();
  const [step, setStep] = useState(0);
  const n = steps.length;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    // Hidden below md (display:none → no offsetParent): nothing to do on phones.
    if (!ref.current?.offsetParent) return;
    const next = Math.min(n - 1, Math.max(0, Math.floor(p * n * 0.999)));
    setStep((cur) => (cur === next ? cur : next));
  });

  return (
    <div ref={ref} className="relative hidden md:block" style={{ height: `calc(${n} * 70svh + 100svh)` }}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="gp-container grid grid-cols-12 items-center gap-8 pt-[var(--gp-header-h)]">
          <div className="col-span-6 lg:col-span-5">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2
              className="mt-3 font-display text-step-head font-semibold leading-[1.02] tracking-[-0.035em] rtl:leading-[1.3] rtl:tracking-normal"
            >
              {title}
            </h2>

            {/* Every step is in the DOM for assistive tech; only the current one is shown. */}
            <ol className="sr-only">
              {steps.map((s, i) => (
                <li key={i}>
                  {s.title}: {s.text}
                </li>
              ))}
            </ol>
            {/* All steps share one grid cell; the current one slides up into place
                (CSS transitions: transform + opacity), the previous one leaves upward. */}
            <div aria-hidden="true" className="mt-8 grid min-h-[22rem]">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    "col-start-1 row-start-1 transition-[opacity,transform] duration-[450ms] ease-gp",
                    i === step
                      ? "translate-y-0 opacity-100 delay-150"
                      : cn("pointer-events-none opacity-0", i < step ? "-translate-y-7" : "translate-y-7")
                  )}
                >
                  <OutlinedNumeral
                    value={i + 1}
                    stroke="raspberry"
                    className="gp-num-ink text-[clamp(6rem,10vw,9.5rem)] tracking-[-0.04em]"
                  />
                  <p className="mt-4 font-display text-[clamp(1.6rem,1.1rem+1.2vw,2.35rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-gp-cream/90 rtl:leading-[1.35] rtl:tracking-normal">
                    {s.title}
                  </p>
                  <p className="mt-4 max-w-[38ch] text-step-body leading-[1.6] text-gp-cream/75">{s.text}</p>
                </div>
              ))}
            </div>
            <div aria-hidden="true" className="mt-4 flex gap-2">
              {steps.map((_, i) => (
                <Segment key={i} index={i} n={n} progress={scrollYProgress} />
              ))}
            </div>
          </div>

          <div className="relative col-span-6 flex justify-center lg:col-span-7">
            {/* Raspberry arch behind the phone, sinking into the ink. */}
            <div
              aria-hidden="true"
              className="absolute inset-y-[-6%] start-1/2 w-[min(440px,82%)] -translate-x-1/2 rounded-t-full bg-gp-raspberry [mask-image:linear-gradient(to_bottom,#000_35%,transparent_96%)] rtl:translate-x-1/2"
            />

            <div className="relative [@media(max-height:760px)]:scale-[0.86]">
              <Phone>
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-300 ease-gp",
                      i === step ? "opacity-100" : "pointer-events-none opacity-0"
                    )}
                  >
                    <OrderScreen step={i} photos={photos} labels={labels} live={!reduced} active={i === step} />
                  </div>
                ))}
              </Phone>
            </div>

            {/* The visitor's inspiration, pinned beside the phone. */}
            <div aria-hidden="true" className="absolute start-0 top-[8%] hidden w-[11.5rem] xl:block xl:start-[2%]">
              <div className="-rotate-6 rounded-[16px] bg-gp-cream p-2 pb-3 shadow-gp-print rtl:rotate-6">
                <span className="relative block aspect-square overflow-hidden rounded-[10px]">
                  <Image src={photos.inspiration.src} alt="" width={176} height={176} className="h-full w-full object-cover" />
                </span>
              </div>
              <HandNote arrow="end" rotate={-6} size="sm" as="span" className="mt-3 ms-6 text-gp-gold" decorative>
                {inspiration}
              </HandNote>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Segment({ index, n, progress }: { index: number; n: number; progress: MotionValue<number> }) {
  const ref = useRef<HTMLSpanElement>(null);
  const paint = useCallback(() => {
    const v = Math.min(1, Math.max(0, progress.get() * n - index));
    if (ref.current) ref.current.style.transform = `scaleX(${v.toFixed(3)})`;
  }, [progress, n, index]);
  useMotionValueEvent(progress, "change", paint);
  useEffect(paint, [paint]);
  return (
    <span className="h-1 w-12 overflow-hidden rounded-full bg-gp-cream/15">
      <span
        ref={ref}
        style={{ transform: "scaleX(0)" }}
        className="block h-full w-full origin-left rounded-full bg-gp-raspberry rtl:origin-right"
      />
    </span>
  );
}