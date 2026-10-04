import { createElement, type ElementType, type ReactNode, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/*
  The écrin surface (DESIGN.md amendment 1): paillette + two-layer sequin dot
  texture, sucre text, dragée focus ring. ONLY for: the "how to order" steps
  band, wedding/engagement moments, the tiramisu preview stage, the footer.
  Never the whole page, never behind a photo (put photos in <Bezel>).

  <EcrinSurface as="section" aria-labelledby="h-steps" className="py-16">…</EcrinSurface>
  <EcrinSurface texture={false}>…</EcrinSurface>      plain paillette
  Copper (text-cuivre) is allowed for numerals/ornament here, never on sucre.
*/

type EcrinProps<T extends ElementType> = {
  as?: T;
  /** Sequin dots (default true). */
  texture?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function EcrinSurface<T extends ElementType = "div">({
  as,
  texture = true,
  className,
  children,
  ...rest
}: EcrinProps<T>) {
  return createElement(
    as ?? "div",
    { className: cn("ecrin text-sucre", texture ? "sequin" : "bg-paillette", className), ...rest },
    children
  );
}

/** 1px copper bezel (~45%) around a framed photo on the écrin surface. */
export function Bezel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("bezel overflow-hidden", className)}>{children}</div>;
}
