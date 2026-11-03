"use client";

import { useReveal } from "./useReveal";

/**
 * Tiny island: wraps server-rendered children and exposes `data-reveal`
 * (idle | wait | in). Each section's CSS (globals.css, `.hv2-*`) decides what
 * "wait" looks like and how "in" animates; "idle" is always the final state.
 */
export default function Reveal({
  as: Tag = "div",
  className,
  children,
  threshold,
  ...rest
}: {
  as?: "div" | "ul" | "ol" | "figure" | "span";
  className?: string;
  children: React.ReactNode;
  threshold?: number;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  const [ref, state] = useReveal<HTMLElement>({ threshold });
  return (
    <Tag ref={ref as React.Ref<never>} data-reveal={state} className={className} {...rest}>
      {children}
    </Tag>
  );
}
