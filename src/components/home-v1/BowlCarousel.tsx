"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useDirSign, useReducedMotionSafe } from "@/components/gp/hooks";

export interface BowlCard {
  src: string;
  alt: string;
  label: string;
  href: string;
  /** Duplicate of a category already in the ring: hidden from AT and tab order. */
  duplicate?: boolean;
}

/**
 * Visible half-angle of the bowl (radians): the screen edge sits at ±PHI.
 * Narrower on small screens, where fewer, larger cards must still reach both edges.
 */
const phiFor = (vw: number) => (vw < 640 ? 0.5 : vw < 1100 ? 0.6 : 0.7);
/** Cards further than this angle are off screen: skipped. */
const HIDE = 1.15;
/** Drift speed at the centre, px/s. */
const DRIFT = 42;
/** Card size at the centre / at the edges (fraction of the full box). */
const SX = [0.68, 1] as const;
const SY = [0.61, 1] as const;

/** Slot of card i in the static (server / reduced-motion) row: 0 = middle, negative = start side. */
function ringSlot(i: number, start: number, n: number) {
  const d = (((i - start) % n) + n) % n;
  return d > n / 2 ? d - n : d;
}

function wrap(v: number, span: number) {
  return ((((v + span / 2) % span) + span) % span) - span / 2;
}
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Rounded trapezoid in the card's local box; `inner` edge is inset by `k` top and bottom. */
function trapezoid(w: number, y0: number, y1: number, k: number, innerRight: boolean, r: number) {
  const lt = innerRight ? y0 : y0 + k;
  const lb = innerRight ? y1 : y1 - k;
  const rt = innerRight ? y0 + k : y0;
  const rb = innerRight ? y1 - k : y1;
  const s = r / w;
  return `path("M 0 ${r1(lt + r)} Q 0 ${r1(lt)} ${r1(r)} ${r1(lt + (rt - lt) * s)} L ${r1(w - r)} ${r1(rt - (rt - lt) * s)} Q ${r1(w)} ${r1(rt)} ${r1(w)} ${r1(rt + r)} L ${r1(w)} ${r1(rb - r)} Q ${r1(w)} ${r1(rb)} ${r1(w - r)} ${r1(rb + (lb - rb) * s)} L ${r1(r)} ${r1(lb - (lb - rb) * s)} Q 0 ${r1(lb)} 0 ${r1(lb - r)} Z")`;
}

/**
 * The hero's "bowl": a looping row of category cards seen from inside a
 * cylinder (small and flat in the middle, tall and slanted at the edges).
 * Each frame writes only `transform` + `clip-path` on fixed-size boxes.
 * Drifts on its own (reversed in RTL), drags with the pointer (vertical page
 * scroll stays native), pauses on hover/focus/offscreen; reduced motion = the
 * server-rendered static row.
 */
export default function BowlCarousel({
  cards,
  label,
  startIndex = 0,
}: {
  cards: BowlCard[];
  label: string;
  /** Card shown in the middle at first. */
  startIndex?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const dir = useDirSign();
  const reduced = useReducedMotionSafe();
  const n = cards.length;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || n < 3) return;
    const items = itemRefs.current.filter(Boolean) as HTMLAnchorElement[];

    let vw = 0;
    let W = 0;
    let H = 0;
    let K = 0;
    let step = 0; // radians between two cards
    let span = 0;
    const measure = () => {
      vw = root.clientWidth;
      W = items[0].offsetWidth;
      H = items[0].offsetHeight;
      K = vw / 2 / Math.tan(phiFor(vw));
      const gap = vw < 640 ? 12 : 16;
      step = (SX[0] * W + gap) / K;
      span = step * n;
    };
    measure();

    // offset in radians: card i sits at angle i*step - offset.
    let offset = startIndex * step;
    let velocity = DRIFT / K; // rad/s, current
    let hovering = false;
    let focused = false;
    let visible = true;
    let dragging = false;
    let dragMoved = 0;
    let lastX = 0;
    let lastT = 0;
    let dragV = 0;
    let focusTarget: number | null = null;
    let frame = 0;
    let prev = 0;

    const render = () => {
      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        const theta = wrap(i * step - offset, span);
        if (Math.abs(theta) > HIDE) {
          if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
          continue;
        }
        if (el.style.visibility) el.style.visibility = "";
        // Screen x of the card centre, relative to the bowl centre (always LTR maths;
        // in RTL the ring order is mirrored so the first card stays at the start).
        const x = K * Math.tan(theta) * dir;
        const t = Math.max(-1.4, Math.min(1.4, x / (vw / 2)));
        const a = Math.abs(t);
        const f = Math.min(1, (a / 0.82) ** 2);
        const sx = SX[0] + (SX[1] - SX[0]) * f;
        const sy = SY[0] + (SY[1] - SY[0]) * f;
        const hv = (H * sy) / sx; // local visible height
        const y0 = (H - hv) / 2;
        const k = (0.09 * Math.min(a, 1) * H * sy) / sx;
        el.style.transform = `translate3d(${r1(x)}px, 0, 0) scale(${sx.toFixed(4)})`;
        el.style.setProperty("--s", sx.toFixed(3));
        el.style.clipPath = trapezoid(W, y0, y0 + hv, k, t < 0, 11 / sx);
      }
    };

    const loop = (now: number) => {
      frame = 0;
      const dt = Math.min(0.05, prev ? (now - prev) / 1000 : 0);
      prev = now;
      if (!dragging) {
        if (focusTarget !== null) {
          // Bring the focused card to the middle (shortest way round).
          const delta = wrap(focusTarget - offset, span);
          offset += delta * Math.min(1, dt * 8);
          if (Math.abs(delta) < 0.0005) focusTarget = null;
        } else {
          const target = hovering || focused ? 0 : DRIFT / K;
          velocity += (target - velocity) * Math.min(1, dt * 3);
          offset += velocity * dt;
        }
      }
      offset = wrap(offset, span); // keep the number small (positions repeat every span)
      render();
      if (visible && !document.hidden) frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!frame && visible && !document.hidden) {
        prev = 0;
        frame = requestAnimationFrame(loop);
      }
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    root.dataset.live = "true";
    render();
    start();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(root);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const ro = new ResizeObserver(() => {
      const ratio = offset / (step || 1);
      measure();
      offset = ratio * step;
      velocity = hovering || focused ? 0 : DRIFT / K;
      render();
    });
    ro.observe(root);

    // Pointer: hover pauses (mouse), drag scrubs the ring.
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovering = true;
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovering = false;
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      dragMoved = 0;
      dragV = 0;
      lastX = e.clientX;
      lastT = e.timeStamp;
      focusTarget = null;
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
      const dTheta = (-dx * dir) / K;
      offset += dTheta;
      const dt = Math.max(1, e.timeStamp - lastT) / 1000;
      lastT = e.timeStamp;
      dragV = dragV * 0.6 + (dTheta / dt) * 0.4;
      if (!frame) render();
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      delete root.dataset.dragging;
      if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
      // Fling, then ease back to the drift (same direction as the fling's sign is fine).
      velocity = Math.max(-4, Math.min(4, dragV));
      start();
    };
    // A drag is not a click.
    const onClick = (e: MouseEvent) => {
      if (dragMoved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      focused = true;
      const i = items.indexOf(e.target as HTMLAnchorElement);
      if (i >= 0) {
        focusTarget = i * step;
        start();
      }
    };
    const onFocusOut = () => {
      focused = false;
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
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
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
      for (const el of items) {
        el.style.transform = "";
        el.style.clipPath = "";
        el.style.visibility = "";
      }
    };
  }, [reduced, n, dir, startIndex]);

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={label}
      className="gp-bowl relative grid h-[var(--bowl-h)] touch-pan-y select-none place-items-center overflow-hidden"
    >
      {cards.map((card, i) => (
        <Link
          key={`${card.href}-${i}`}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          href={card.href}
          draggable={false}
          tabIndex={card.duplicate ? -1 : undefined}
          aria-hidden={card.duplicate || undefined}
          className="gp-bowl-card group relative col-start-1 row-start-1 block h-[var(--bowl-ch)] w-[var(--bowl-cw)] overflow-hidden rounded-[12px] bg-gp-champagne will-change-transform focus-visible:outline-offset-[-4px]"
          style={{ "--i": ringSlot(i, startIndex, n) } as React.CSSProperties}
        >
          <Image
            src={card.src}
            alt=""
            fill
            draggable={false}
            sizes="(min-width: 2000px) 240px, (min-width: 1100px) 12vw, 132px"
            priority={Math.abs(i - startIndex) <= 1}
            className="pointer-events-none object-cover"
          />
          {/* The label is the link's name (the photo is decorative). It keeps a
              constant visual size: counter-scaled against the card's --s. */}
          <span className="gp-bowl-label absolute bottom-[11%] start-[5%] line-clamp-2 rounded-[11px] bg-gp-ink/60 px-2 py-[3px] text-[12px] font-medium leading-[1.25] text-gp-cream hyphens-auto lg:px-2.5 lg:text-[13px] 2xl:text-[14px]">
            {card.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
