"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import WhatsAppIcon from "../WhatsAppIcon";
import { useOrderHref } from "@/lib/order";
import { cn } from "@/lib/utils";

/**
 * Phones/tablets: a bottom "Commander sur WhatsApp" pill in the thumb zone.
 * Shows once the `[data-hero-cta]` element has scrolled above the viewport
 * (or, on pages without one, after 60% of a screen), and hides while any
 * `[data-final-cta]` element (final CTA section, footer) is on screen.
 */
export default function StickyOrderPill({ suppressed = false }: { suppressed?: boolean }) {
  const t = useTranslations("frame");
  const order = useOrderHref();
  const [pastHero, setPastHero] = useState(false);
  const [finalVisible, setFinalVisible] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);

  useEffect(() => {
    // A scroll read (not an IntersectionObserver): a jump from below the hero
    // CTA to far past it never "crosses" it, and IO would miss that.
    const hero = document.querySelector("[data-hero-cta]");
    let frame = 0;
    const main = document.getElementById("main");
    const read = () => {
      frame = 0;
      setPastHero(
        hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > window.innerHeight * 0.6
      );
      // A curtain footer is fixed (always "intersecting"): it is on screen
      // only once <main> has lifted off it.
      setCurtainOpen(main ? main.getBoundingClientRect().bottom < window.innerHeight - 1 : false);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });

    const visible = new Set<Element>();
    const finalIO = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (getComputedStyle(e.target).position === "fixed") visible.delete(e.target);
        else if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      setFinalVisible(visible.size > 0);
    });
    document.querySelectorAll("[data-final-cta]").forEach((el) => finalIO.observe(el));

    return () => {
      finalIO.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const shown = pastHero && !finalVisible && !curtainOpen && !suppressed;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:hidden",
        "transition-[transform,opacity] duration-300 ease-gp",
        shown ? "translate-y-0 opacity-100" : "translate-y-[140%] opacity-0"
      )}
      inert={!shown}
      data-tone="cream"
    >
      <a
        href={order()}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto inline-flex min-h-14 w-full max-w-sm items-center justify-center gap-2.5 rounded-full bg-gp-raspberry px-6 text-[1rem] font-semibold text-gp-cream shadow-[0_14px_30px_-10px_rgb(var(--gp-ink)/0.45)] ring-2 ring-gp-cream/60 transition-transform duration-150 ease-gp active:scale-[0.98]"
      >
        <WhatsAppIcon className="h-5 w-5 shrink-0" />
        <span>{t("order_full")}</span>
        <span className="sr-only"> ({t("opens_whatsapp")})</span>
      </a>
    </div>
  );
}
