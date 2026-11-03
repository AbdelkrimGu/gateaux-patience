"use client";

import { useInViewOnce } from "../hooks";
import { BrandWordmark } from "../Brand";
import { cn } from "@/lib/utils";

/** The giant script wordmark, rising once into place when it scrolls into view. */
export default function WordmarkRise({ className }: { className?: string }) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>({ threshold: 0.2 });
  return (
    <div ref={ref} className="overflow-hidden" dir="ltr">
      <div
        className={cn(
          "transition-transform duration-[1100ms] ease-gp motion-reduce:translate-y-[12%]",
          inView ? "translate-y-[12%]" : "translate-y-[55%]"
        )}
      >
        <BrandWordmark className={cn("mx-auto w-[min(96vw,1500px)] text-gp-gold", className)} />
      </div>
    </div>
  );
}
