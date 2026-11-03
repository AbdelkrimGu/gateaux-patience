"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useDirSign, useReducedMotionSafe } from "@/components/gp/hooks";

export interface BowlCard {
  src: string;
  label: string;
  href: string;
  ariaLabel: string;
}

const MIN_CARDS = 8;
const BOWL_K = 0.15; // spacing grows towards the edges (inside of a cylinder)
const SPEED = 42; // px/s drift
const INTRO_MS = 1100;
const BOX_RATIO = 0.76; // card box width / height (must match .hv2-bowl-card)
const FLAT_SCALE = 0.8; // flat row (server HTML / reduced motion)
const CENTRE_SCALE = 0.64; // bowl: centre cards small, edge cards full size
const MAX_ANGLE = 38; // deg: edge cards turn to face the centre
const PERSPECTIVE = 700; // px

/** Slot of card i around the centre: 0, 1, 2 … then −n … −1 (loops both ways). */
function slotOf(i: number, n: number) {
  return i <= Math.floor(n / 2) ? i : i - n;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Hero "bowl" carousel (motion.md §1): a looping row of photo cards seen from
 * inside a cylinder — small at the centre, tall and turned towards the centre
 * at the edges. Compositor-only: each frame writes one transform per card
 * (translate · perspective · rotateY · scale) and one per label — no layout,
 * no clip-path, no repaint (motion.md §1 performance rule). Drifts (reversed in RTL), drags with inertia (touch-action: pan-y),
 * pauses on hover/focus/offscreen/hidden tab. Reduced motion: flat static row,
 * still draggable. Server HTML renders the flat row (CSS), so nothing waits on JS.
 */
export default function BowlCarousel({ cards, label }: { cards: BowlCard[]; label: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dir = useDirSign();
  const reduced = useReducedMotionSafe();

  // Fill the loop: duplicates are hidden from assistive tech and tab order.
  const list: (BowlCard & { dup: boolean })[] = cards.map((c) => ({ ...c, dup: false }));
  for (let i = 0; list.length < MIN_CARDS && cards.length > 0; i++) {
    list.push({ ...cards[i % cards.length], dup: true });
  }
  const n = list.length;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || n === 0) return;
    const els = cardRefs.current.slice(0, n);
    const labels = labelRefs.current.slice(0, n);

    // Geometry (re-read on resize).
    let cw = 0;
    let H0 = 0;
    let W0 = 0;
    let P = 0;
    let T = 0;
    const measure = () => {
      cw = wrap.clientWidth;
      H0 = els[0]?.offsetHeight ?? 0;
      W0 = els[0]?.offsetWidth || H0 * BOX_RATIO;
      P = Math.max(140, cw * 0.125);
      T = n * P;
      // Labels are counter-scaled to a constant size: they must fit the
      // narrowest (centre) card. Set once, not per frame.
      const narrow = W0 * CENTRE_SCALE;
      labels.forEach((l) => l && (l.style.maxWidth = `${Math.max(72, narrow - 12)}px`));
    };

    let offset = 0; // track-space shift, px
    let vel = 0; // px/s, relaxes towards the drift
    let warp = 0; // 0 = flat row (matches the CSS), 1 = bowl
    let introStart = -1;
    let hover = false;
    let focusWithin = false;
    let visible = true;
    let raf = 0;
    let last = 0;
    let tween: { from: number; to: number; t0: number; ms: number } | null = null;

    const drift = () => (reduced || hover || focusWithin || drag.active ? 0 : -dir * SPEED);

    const wrapTrack = (u: number) => ((((u + T / 2) % T) + T) % T) - T / 2;

    const render = () => {
      const half = cw / 2;
      const k = BOWL_K * warp;
      const gp = (a: number) => (1 + 2 * k * a) / (1 + k);
      for (let i = 0; i < n; i++) {
        const el = els[i];
        if (!el) continue;
        const u = wrapTrack(slotOf(i, n) * P + offset);
        const p = u / half;
        const a = Math.min(Math.abs(p), 1);
        const g =
          Math.abs(p) <= 1
            ? (p * (1 + k * Math.abs(p))) / (1 + k)
            : Math.sign(p) * (1 + gp(1) * (Math.abs(p) - 1));
        const X = half + half * g;
        const s = lerp(FLAT_SCALE, lerp(CENTRE_SCALE, 1, a), warp);
        // The side facing the centre recedes (shorter): a rounded trapezoid for free.
        const angle = -Math.sign(p) * a * MAX_ANGLE * warp;
        const x = X - W0 / 2; // transform-origin is the card centre
        el.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0) perspective(${PERSPECTIVE}px) rotateY(${angle.toFixed(2)}deg) scale(${s.toFixed(4)})`;
        const lab = labels[i];
        if (lab) lab.style.transform = `translateX(-50%) scale(${(1 / s).toFixed(4)})`;
      }
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (!reduced && warp < 1) {
        if (introStart < 0) introStart = now;
        warp = easeOut(Math.min(1, (now - introStart) / INTRO_MS));
      }
      if (tween) {
        const t = Math.min(1, (now - tween.t0) / tween.ms);
        offset = lerp(tween.from, tween.to, reduced ? 1 : easeOut(t));
        if (t >= 1) tween = null;
        vel = 0;
      } else if (!drag.active) {
        vel += (drift() - vel) * Math.min(1, dt * 2.5);
        offset += vel * dt;
      }
      render();
      const settled = reduced ? !tween && Math.abs(vel) < 1 : false;
      if (visible && !document.hidden && !settled) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    let ready = false; // set after load + idle, or on the first interaction
    const start = () => {
      if (ready && !raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    // Drag with inertia. Vertical swipes still scroll the page (touch-action: pan-y).
    const drag = { active: false, id: -1, x: 0, lastX: 0, lastT: 0, moved: 0, v: 0 };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      ready = true;
      drag.active = true;
      drag.id = e.pointerId;
      drag.x = drag.lastX = e.clientX;
      drag.lastT = e.timeStamp;
      drag.moved = 0;
      drag.v = 0;
      tween = null;
      start();
    };
    const onMove = (e: PointerEvent) => {
      if (!drag.active || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.lastX;
      const dtm = Math.max(1, e.timeStamp - drag.lastT);
      drag.moved += Math.abs(dx);
      if (drag.moved > 6 && !wrap.hasPointerCapture(e.pointerId)) {
        wrap.setPointerCapture(e.pointerId);
        wrap.dataset.dragging = "";
      }
      offset += dx;
      drag.v = lerp(drag.v, (dx / dtm) * 1000, 0.4);
      drag.lastX = e.clientX;
      drag.lastT = e.timeStamp;
      render();
    };
    const onUp = (e: PointerEvent) => {
      if (!drag.active || e.pointerId !== drag.id) return;
      drag.active = false;
      delete wrap.dataset.dragging;
      vel = Math.max(-2400, Math.min(2400, drag.v));
      if (reduced) vel = 0;
      start();
    };
    const onClickCapture = (e: MouseEvent) => {
      if (drag.moved > 6) {
        e.preventDefault();
        e.stopPropagation();
        drag.moved = 0;
      }
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hover = true;
    };
    const onLeave = () => {
      hover = false;
      start();
    };
    // Keyboard: bring the focused card to the centre.
    const onFocusIn = (e: FocusEvent) => {
      ready = true;
      focusWithin = true;
      const i = els.indexOf(e.target as HTMLAnchorElement);
      if (i < 0) return;
      // The browser may scroll the overflow box to reveal the link: undo it.
      wrap.scrollLeft = 0;
      const u = wrapTrack(slotOf(i, n) * P + offset);
      tween = { from: offset, to: offset - u, t0: performance.now(), ms: 650 };
      start();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!wrap.contains(e.relatedTarget as Node)) {
        focusWithin = false;
        start();
      }
    };

    measure();
    render();
    const ro = new ResizeObserver(() => {
      measure();
      render();
    });
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(wrap);
    const onVis = () => {
      if (!document.hidden) start();
    };
    document.addEventListener("visibilitychange", onVis);
    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);
    wrap.addEventListener("click", onClickCapture, true);
    wrap.addEventListener("pointerenter", onEnter);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("focusin", onFocusIn);
    wrap.addEventListener("focusout", onFocusOut);
    wrap.dataset.live = "";

    // Stay off the critical path: the flat row (CSS) shows until the page has
    // loaded and the main thread is idle; then the bowl forms and drifts.
    // A drag or keyboard focus before that starts it immediately.
    let idleId = 0;
    const begin = () => {
      ready = true;
      start();
    };
    const whenIdle = () => {
      const ric = window.requestIdleCallback;
      idleId = ric ? ric(begin, { timeout: 1500 }) : window.setTimeout(begin, 300);
    };
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });

    return () => {
      window.removeEventListener("load", whenIdle);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      window.clearTimeout(idleId);
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
      wrap.removeEventListener("click", onClickCapture, true);
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("focusin", onFocusIn);
      wrap.removeEventListener("focusout", onFocusOut);
      delete wrap.dataset.live;
    };
  }, [n, dir, reduced]);

  return (
    <div
      ref={wrapRef}
      role="region"
      aria-label={label}
      className="hv2-bowl relative w-full cursor-grab touch-pan-y select-none overflow-hidden data-[dragging]:cursor-grabbing"
      dir="ltr"
    >
      {list.map((c, i) => (
        <Link
          key={`${c.src}-${i}`}
          ref={(el: HTMLAnchorElement | null) => {
            cardRefs.current[i] = el;
          }}
          href={c.href}
          draggable={false}
          aria-label={c.ariaLabel}
          aria-hidden={c.dup || undefined}
          tabIndex={c.dup ? -1 : undefined}
          className="hv2-bowl-card"
          style={{ "--k": slotOf(i, n) } as React.CSSProperties}
        >
          <Image
            src={c.src}
            alt=""
            fill
            draggable={false}
            sizes="(min-width: 768px) 230px, 160px"
            loading={Math.abs(slotOf(i, n)) <= 1 ? "eager" : "lazy"}
            className="object-cover"
            style={{ objectPosition: "50% 45%" }}
          />
          <span
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            className="hv2-bowl-label"
          >
            {c.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
