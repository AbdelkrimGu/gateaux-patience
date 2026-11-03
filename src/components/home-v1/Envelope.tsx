"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useReducedMotionSafe } from "@/components/gp/hooks";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (v: number) => 1 - (1 - v) ** 3;

/**
 * 5 · The letter comes out of the envelope as the section scrolls in: the
 * flap opens (rotateX), the letter rises (translateY, clipped at the
 * envelope's bottom so it looks like it comes from inside), the script
 * signature is revealed last (clip-path). The gold crown wax seal stays on
 * the pocket. Server render / reduced motion: letter out, flap open.
 */
export default function Envelope({
  letter,
  signature,
}: {
  letter: React.ReactNode;
  signature: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const envRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();
  const flapRef = useRef<HTMLDivElement>(null);
  const signRef = useRef<HTMLDivElement>(null);
  const shift = useRef(0); // px; 0 = letter out (server render, reduced motion)

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start 92%", "end 85%"] });

  // One write per frame: transform / clip-path only.
  const paint = useCallback(() => {
    const p = scrollYProgress.get();
    const s = shift.current;
    const rise = easeOut(clamp01((p - 0.18) / 0.6));
    const flap = s === 0 ? 180 : 180 * easeOut(clamp01(p / 0.26));
    const sign = s === 0 ? 1 : easeOut(clamp01((p - 0.7) / 0.22));
    if (letterRef.current) letterRef.current.style.transform = `translate3d(0, ${(s * (1 - rise)).toFixed(1)}px, 0)`;
    if (flapRef.current) {
      flapRef.current.style.transform = `perspective(1100px) rotateX(${flap.toFixed(1)}deg)`;
      flapRef.current.style.zIndex = flap < 90 ? "30" : "0";
    }
    if (signRef.current) signRef.current.style.clipPath = `inset(-20% ${((1 - sign) * 100).toFixed(1)}% -20% 0)`;
  }, [scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", paint);

  // How far down the letter starts: its top a third of the way into the envelope.
  useEffect(() => {
    const l = letterRef.current;
    const e = envRef.current;
    if (!l || !e || reduced) {
      shift.current = 0;
      paint();
      return;
    }
    const measure = () => {
      shift.current = Math.max(0, l.offsetHeight - 0.66 * e.offsetHeight);
      paint();
    };
    const ro = new ResizeObserver(measure);
    ro.observe(l);
    ro.observe(e);
    measure();
    return () => ro.disconnect();
  }, [reduced, paint]);

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-[560px]">
      {/* Letter slot: clipped at its own bottom edge (inside the envelope). */}
      <div className="relative z-10 mx-[5%] [clip-path:inset(-100vh_-60px_0_-60px)]">
        <div
          ref={letterRef}
          className="relative rounded-[6px] bg-gp-cream px-6 pb-[calc(67%+1.25rem)] pt-7 text-gp-ink shadow-[0_24px_50px_-30px_rgb(var(--gp-ink)/0.55)] md:px-10 md:pt-10"
        >
          {letter}
          <div ref={signRef} className="mt-2 w-fit" dir="ltr">
            {signature}
          </div>
        </div>
      </div>

      {/* Envelope: back, flap, pocket, seal. Tucks 96 % under the letter's bottom. */}
      <div
        ref={envRef}
        aria-hidden="true"
        className="relative mt-[-60%] aspect-[16/10] w-full"
      >
        <span className="absolute inset-0 rounded-[12px] shadow-[0_34px_60px_-34px_rgb(var(--gp-ink)/0.55)] bg-[color-mix(in_srgb,rgb(var(--gp-raspberry))_78%,rgb(var(--gp-ink)))]" />
        {/* Server render = open (rotated up, behind the letter). */}
        <div
          ref={flapRef}
          style={{ transform: "perspective(1100px) rotateX(180deg)", zIndex: 0 }}
          className="absolute inset-x-0 top-0 h-[58%] origin-top"
        >
          <svg viewBox="0 0 160 58" preserveAspectRatio="none" className="h-full w-full">
            <polygon
              points="0,0 160,0 80,58"
              fill="color-mix(in srgb, rgb(var(--gp-raspberry)) 88%, rgb(var(--gp-ink)))"
            />
          </svg>
        </div>
        <svg
          viewBox="0 0 160 100"
          preserveAspectRatio="none"
          className="absolute inset-0 z-20 h-full w-full overflow-hidden rounded-[12px]"
        >
          <polygon points="0,0 80,56 0,100" fill="rgb(var(--gp-raspberry))" />
          <polygon points="160,0 80,56 160,100" fill="rgb(var(--gp-raspberry))" />
          <polygon
            points="0,100 80,47 160,100"
            fill="color-mix(in srgb, rgb(var(--gp-raspberry)) 90%, rgb(var(--gp-cream)))"
          />
          {/* Hairline folds catch the light. */}
          <polyline
            points="0,100 80,47 160,100"
            fill="none"
            stroke="rgb(var(--gp-cream) / 0.22)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <WaxSeal className="absolute start-1/2 top-[47%] z-30 w-[17%] max-w-[92px] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2" />
      </div>
    </div>
  );
}

// A slightly irregular wax disc (fixed points: identical on server and client).
const WAX = (() => {
  const pts: string[] = [];
  const bumps = [1, 0.96, 1.02, 0.97, 1.03, 0.95, 1, 1.02, 0.96, 1.01, 0.97, 1.03, 0.98, 1, 0.95, 1.02];
  for (let i = 0; i < bumps.length; i++) {
    const a = (i / bumps.length) * Math.PI * 2;
    const r = 46 * bumps[i];
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  // Smooth closed curve through the points (quadratic midpoints).
  const p = pts.map((s) => s.split(",").map(Number));
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2].map((v) => v.toFixed(1)).join(" ");
  let d = `M ${mid(p[p.length - 1], p[0])}`;
  for (let i = 0; i < p.length; i++) d += ` Q ${p[i][0]} ${p[i][1]} ${mid(p[i], p[(i + 1) % p.length])}`;
  return d + " Z";
})();

/** Gold wax seal stamped with the logo's crown. */
function WaxSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={{ filter: "drop-shadow(0 6px 8px rgb(var(--gp-ink) / 0.35))" }}>
      <path d={WAX} fill="rgb(var(--gp-gold))" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="color-mix(in srgb, rgb(var(--gp-gold)) 70%, rgb(var(--gp-ink)))" strokeWidth="2.2" />
      <circle cx="50" cy="50" r="29" fill="color-mix(in srgb, rgb(var(--gp-gold)) 88%, rgb(var(--gp-ink)))" opacity="0.55" />
      {/* Crown */}
      <path
        d="M31 60 L28 38 L40 48 L50 33 L60 48 L72 38 L69 60 Z"
        fill="color-mix(in srgb, rgb(var(--gp-gold)) 62%, rgb(var(--gp-ink)))"
      />
      <rect x="31" y="62" width="38" height="5" rx="1.5" fill="color-mix(in srgb, rgb(var(--gp-gold)) 62%, rgb(var(--gp-ink)))" />
      <circle cx="28" cy="36" r="2.6" fill="color-mix(in srgb, rgb(var(--gp-gold)) 62%, rgb(var(--gp-ink)))" />
      <circle cx="50" cy="31" r="2.8" fill="color-mix(in srgb, rgb(var(--gp-gold)) 62%, rgb(var(--gp-ink)))" />
      <circle cx="72" cy="36" r="2.6" fill="color-mix(in srgb, rgb(var(--gp-gold)) 62%, rgb(var(--gp-ink)))" />
      {/* Soft highlight on the wax */}
      <path d="M24 34 C 30 22, 44 16, 56 17" fill="none" stroke="rgb(var(--gp-cream) / 0.45)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
