"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type State = "idle" | "armed" | "in";

/**
 * Plays a CSS entrance once, without ever hiding content that is already on
 * screen: the server renders the final state ("idle"); after mount, if the
 * block is still below the fold (and motion is allowed) it is "armed" (hidden
 * state from home-v1.css), then "in" when it scrolls into view.
 */
export default function RevealOnView({
  children,
  className,
  as: Tag = "div",
  rootMargin = "0px 0px -15% 0px",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "ol" | "ul";
  rootMargin?: string;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return; // already seen
    setState("armed"); // only after measuring the DOM: the server render stays visible
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("in");
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-reveal={state}
      className={cn("gp-reveal", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
