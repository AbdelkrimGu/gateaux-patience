"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useDirSign, useReducedMotionSafe } from "@/components/gp/hooks";

export interface BowlCard {
  /** Stable id (category or cake slug). */
  slug: string;
  src: string;
  /** Accessible name of the link (full category name or cake title). */
  name: string;
  /** Short visible pill label (categories only). */
  label?: string;
  href: string;
}

/**
 * Visible half-angle of the bowl (radians): the screen edge sits at ±phi.
 * Narrower on small screens, where fewer, larger cards must still reach both edges.
 */
const phiFor = (vw: number) => (vw < 640 ? 0.5 : vw < 1100 ? 0.6 : 0.7);
/** Drift speed at the centre, px/s. */
const DRIFT = 42;
/** Card scale at the centre / at the edges. */
const S0 = 0.66;
const S1 = 1;
/** Max inward turn of a card at the screen edge (deg). */
const TURN = 26;

/** Slot of card i in the static (server) row: 0 = middle, negative = start side. */
function ringSlot(i: number, start: number, n: number) {
  const d = (((i - start) % n) + n) % n;
  return d > n / 2 ? d - n : d;
}


/**
 * The hero's "bowl": a looping row of cards seen from inside a cylinder
 * (small and flat in the middle, larger and turned inward at the edges).
 * Compositor-driven: each card plays one looping Web Animation of
 * `transform` (translate · perspective · rotateY · scale) + `opacity`, its
 * label one of scale + opacity — nothing runs on the main thread per frame.
 * Drifts on its own (reversed in RTL), drags with the pointer (scrubs the
 * animations' time; vertical scroll stays native), stops on hover, focus,
 * offscreen and with the pause button (WCAG 2.2.2). Reduced motion: a
 * swipeable row.
 */
export default function BowlCarousel({
  cards,
  label,
  pauseLabel,
  playLabel,
  startIndex = 0,
}: {
  cards: BowlCard[];
  label: string;
  pauseLabel: string;
  playLabel: string;
  /** Card shown in the middle at first. */
  startIndex?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pausedRef = useRef(false);
  const kickRef = useRef<() => void>(() => {});
  const [paused, setPaused] = useState(false);
  const dir = useDirSign();
  const reduced = useReducedMotionSafe();
  const n = cards.length;

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    kickRef.current();
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || n < 4 || typeof root.animate !== "function") return;
    const items = itemRefs.current.slice(0, n) as HTMLAnchorElement[];
    const labels = labelRefs.current.slice(0, n);
    const FRAMES = 96;

    // Geometry → one looping keyframe track per card. The drift itself runs as
    // Web Animations on the compositor (transform + opacity only): no work on
    // the main thread per frame, so a busy phone can't make it stutter.
    let span = 0; // radians for a full turn
    let step = 0; // radians between two cards
    let T = 1; // ms for a full turn at drift speed
    let anims: Animation[] = [];
    const offsets: number[] = []; // per-card phase offset (ms)

    const build = (keepTau: number | null) => {
      for (const a of anims) a.cancel();
      anims = [];
      const vw = root.clientWidth;
      const W = items[0].offsetWidth;
      const H = items[0].offsetHeight;
      const K = vw / 2 / Math.tan(phiFor(vw));
      const hide = Math.atan((vw / 2 + W * 0.62) / K) + 0.02;
      const gap = vw < 640 ? 12 : 16;
      // Never shorter than the visible arc: a card must wrap off screen.
      step = Math.max((S0 * W + gap) / K, (2 * hide) / n);
      span = step * n;
      T = (span / (DRIFT / K)) * 1000;
      pxPerMs = (K * (span / T)) || 1;

      const cardFrames: Keyframe[] = [];
      const labelFrames: Keyframe[] = [];
      for (let k = 0; k <= FRAMES; k++) {
        // θ runs from +span/2 (just wrapped, off screen) to −span/2.
        const theta = span / 2 - (k / FRAMES) * span;
        const th = Math.max(-hide, Math.min(hide, theta));
        const x = K * Math.tan(th) * dir;
        const t = x / (vw / 2);
        const a = Math.min(Math.abs(t), 1.25);
        const f = Math.min(1, (a / 0.85) ** 2);
        const s = S0 + (S1 - S0) * f;
        const turn = -Math.sign(t) * TURN * Math.min(a, 1);
        const shown = Math.abs(theta) <= hide;
        cardFrames.push({
          offset: k / FRAMES,
          transform: `translate3d(${x.toFixed(1)}px,0,0) perspective(800px) rotateY(${turn.toFixed(2)}deg) scale(${s.toFixed(4)})`,
          opacity: shown ? 1 : 0,
        });
        // Labels are separate, unscaled layers pinned to the card's bottom-start
        // corner (animating them inside the 3D card would re-raster the photo).
        const half = ((s * W) / 2) * Math.cos((turn * Math.PI) / 180);
        const lx = x + dir * (-half + 0.07 * s * W);
        const ly = (s * H) / 2 - 0.1 * s * H;
        labelFrames.push({
          offset: k / FRAMES,
          transform: `translate3d(${lx.toFixed(1)}px,${ly.toFixed(1)}px,0)`,
          opacity: shown ? Math.min(1, Math.max(0, 1 - (a - 0.55) / 0.35)) : 0,
        });
      }
      const timing: KeyframeAnimationOptions = { duration: T, iterations: Infinity, easing: "linear" };
      for (let i = 0; i < n; i++) {
        // At τ = 0 card i sits at θ = i·step: phase = (span/2 − i·step) / span.
        offsets[i] = ((((span / 2 - i * step) / span) % 1) + 1) % 1 * T;
        anims.push(items[i].animate(cardFrames, timing));
        const lab = labels[i];
        if (lab) anims.push(lab.animate(labelFrames, timing));
      }
      setTau(keepTau ?? (startIndex * step / span) * T);
      if (!running()) for (const a of anims) a.pause();
    };

    // τ: the ring's position in ms of drift (offset in radians = τ / T · span).
    let tau = 0;
    let pxPerMs = 1;
    const setTau = (value: number) => {
      tau = ((value % T) + T) % T;
      let j = 0;
      for (let i = 0; i < n; i++) {
        const ct = (tau + offsets[i]) % T;
        anims[j++].currentTime = ct;
        if (labels[i]) anims[j++].currentTime = ct;
      }
    };
    const readTau = () => {
      const ct = Number(anims[0]?.currentTime ?? 0);
      return ((ct - offsets[0]) % T + T) % T;
    };

    let hovering = false;
    let focused = false;
    let visible = true;
    let dragging = false;
    const running = () => !hovering && !focused && !dragging && visible && !pausedRef.current && !document.hidden;
    const sync = () => {
      const go = running();
      for (const a of anims) {
        if (go && a.playState !== "running") a.play();
        else if (!go && a.playState === "running") a.pause();
      }
    };
    kickRef.current = sync;

    build(null);
    root.dataset.live = "true";
    sync();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", sync);
    let lastW = root.clientWidth;
    const ro = new ResizeObserver(() => {
      if (root.clientWidth === lastW) return;
      lastW = root.clientWidth;
      const phase = readTau() / T;
      build(null);
      setTau(phase * T);
      sync();
    });
    ro.observe(root);

    // Pointer: hover pauses (mouse), drag scrubs the ring.
    let dragMoved = 0;
    let lastX = 0;
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        hovering = true;
        sync();
      }
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        hovering = false;
        sync();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      dragMoved = 0;
      lastX = e.clientX;
      sync();
      tau = readTau();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      dragMoved += Math.abs(dx);
      if (dragMoved > 6 && !root.hasPointerCapture(e.pointerId)) {
        root.setPointerCapture(e.pointerId);
        root.dataset.dragging = "true";
      }
      // Dragging toward the end moves the ring back in time.
      setTau(tau - (dx * dir) / pxPerMs);
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      delete root.dataset.dragging;
      if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
      sync();
    };
    // A drag is not a click (keyboard activation has detail 0: always let it through).
    const onClick = (e: MouseEvent) => {
      if (e.detail === 0) return;
      if (dragMoved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
      dragMoved = 0;
    };
    const onFocusIn = (e: FocusEvent) => {
      focused = true;
      sync();
      const i = items.indexOf(e.target as HTMLAnchorElement);
      if (i >= 0) setTau(((i * step) / span) * T); // bring it to the middle
    };
    const onFocusOut = () => {
      focused = false;
      sync();
    };

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
    root.addEventListener("click", onClick, true);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);

    return () => {
      kickRef.current = () => {};
      for (const a of anims) a.cancel();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      root.removeEventListener("click", onClick, true);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      delete root.dataset.live;
      delete root.dataset.dragging;
    };
  }, [reduced, n, dir, startIndex]);
  // Preload the middle card and its two neighbours (wrapping round the ring).
  const preloaded = new Set([startIndex, (startIndex + 1) % n, (startIndex - 1 + n) % n]);

  return (
    <div className="relative">
      <div
        ref={rootRef}
        role="group"
        aria-label={label}
        className="gp-bowl relative grid h-[var(--bowl-h)] touch-pan-y select-none place-items-center overflow-hidden"
      >
        {cards.map((card, i) => (
          <Link
            key={card.slug}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            href={card.href}
            draggable={false}
            aria-label={card.name}
            className="gp-bowl-card group relative col-start-1 row-start-1 block h-[var(--bowl-ch)] w-[var(--bowl-cw)] overflow-hidden rounded-[14px] bg-gp-champagne outline-none will-change-transform"
            style={{ "--i": ringSlot(i, startIndex, n) } as React.CSSProperties}
          >
            <Image
              src={card.src}
              alt=""
              fill
              draggable={false}
              sizes="(min-width: 2000px) 240px, (min-width: 1100px) 12vw, 132px"
              preload={preloaded.has(i)}
              className="pointer-events-none object-cover"
            />
            {/* Focus ring drawn inside the card (its own outline would be clipped). */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[3px] rounded-[11px] ring-gp-raspberry group-focus-visible:ring-[3px]"
            />
            {/* Static row (server, reduced motion): the label sits in the card. */}
            {card.label ? (
              <span
                aria-hidden="true"
                className="gp-bowl-label absolute bottom-[10%] start-[7%] max-w-[86%] truncate rounded-full bg-gp-ink/75 px-2.5 py-[3px] text-[13px] font-medium leading-[1.3] text-gp-cream lg:text-[14px]"
              >
                {card.label}
              </span>
            ) : null}
          </Link>
        ))}
        {/* Live ring: labels ride above the cards as their own small layers. */}
        {cards.map((card, i) =>
          card.label ? (
            <span
              key={`tag-${card.slug}`}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              aria-hidden="true"
              className="gp-bowl-tag pointer-events-none relative col-start-1 row-start-1 h-0 w-0 will-change-transform"
            >
              <span className="absolute bottom-0 start-0 whitespace-nowrap rounded-full bg-gp-ink/75 px-2.5 py-[3px] text-[13px] font-medium leading-[1.3] text-gp-cream lg:text-[14px]">
                {card.label}
              </span>
            </span>
          ) : null
        )}
      </div>
      {/* WCAG 2.2.2: the drift can be stopped. Below the ring (never over a
          label); hidden when motion is reduced (nothing moves then). */}
      <div className="gp-container mt-2 flex justify-end motion-reduce:hidden">
      <button
        type="button"
        onClick={togglePause}
        aria-pressed={paused}
        aria-label={paused ? playLabel : pauseLabel}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gp-ink/70 ring-1 ring-gp-ink/15 transition-colors hover:bg-gp-ink/5 hover:text-gp-ink"
      >
        {paused ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
      </button>
      </div>
    </div>
  );
}
