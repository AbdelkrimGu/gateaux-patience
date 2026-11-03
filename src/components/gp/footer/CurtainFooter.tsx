"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** px of footer hidden under main's rounded bottom (= -mt-10 in static mode). */
const TUCK = 40;

/**
 * Curtain reveal: the footer is fixed behind the page and the lifted, rounded
 * `<main>` (see SiteFrame) scrolls away to reveal it. A spacer of the measured
 * footer height (ResizeObserver) gives the page its scroll room.
 *
 * Server render = a normal static footer tucked under main's rounded corners;
 * the curtain switches on after measuring, and only when the footer fits in
 * 85% of the small viewport height (otherwise it stays static).
 */
export default function CurtainFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(0);
  const [curtain, setCurtain] = useState(false);

  useEffect(() => {
    const footer = ref.current;
    if (!footer) return;
    // 100svh stays put while mobile URL bars show/hide (no flip-flopping).
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:100svh;width:0;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);

    const measure = () => {
      const h = footer.offsetHeight;
      const vh = probe.offsetHeight || window.innerHeight;
      setHeight(h);
      setCurtain(h > 0 && h <= vh * 0.85);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(footer);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      probe.remove();
    };
  }, []);

  // Keyboard users tabbing into a footer still covered by <main>: reveal it.
  const onFocus = () => {
    if (!curtain) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY < max - 2) window.scrollTo({ top: max });
  };

  return (
    <>
      {/* The footer's top TUCK px sit under main's rounded corners in both modes. */}
      {curtain ? <div aria-hidden="true" style={{ height: Math.max(0, height - TUCK) }} /> : null}
      <footer
        ref={ref}
        data-tone="ink"
          data-header-tone="ink"
        data-final-cta
        onFocus={onFocus}
        className={cn(
          "inset-x-0 bottom-0 z-0 bg-gp-ink text-gp-cream",
          "pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-20 md:pt-28",
          curtain ? "fixed" : "relative -mt-10",
          className
        )}
      >
        {children}
      </footer>
    </>
  );
}
