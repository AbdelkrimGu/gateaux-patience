"use client";

import { useInViewOnce } from "../hooks";
import { BrandWordmark } from "../Brand";
import { cn } from "@/lib/utils";

/**
 * The giant script wordmark, rising once into place when it scrolls into view.
 * Root margin 0 / threshold 0: it sits at the very bottom of the page, so a
 * shrunk root (the hook's default) would never see it at max scroll on phones.
 */
export default function WordmarkRise({ className }: { className?: string }) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>({ rootMargin: "0px", threshold: 0 });
  return (
    <div ref={ref} className="overflow-hidden" dir="ltr">
      <div
        className={cn(
          "transition-transform duration-[1100ms] ease-gp motion-reduce:translate-y-[12%]",
          inView ? "translate-y-[12%]" : "translate-y-[55%]"
        )}
      >
        {/* The mask is 819px wide: keep the upscale ≤ 2× (1500 css px at 1x, 820 at 2x). */}
        <BrandWordmark
          className={cn(
            "mx-auto w-[min(96vw,1500px)] text-gp-gold [@media(min-resolution:2dppx)]:max-w-[820px]",
            className
          )}
        />
      </div>
    </div>
  );
}
