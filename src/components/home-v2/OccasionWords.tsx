"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import WhatsAppIcon from "@/components/gp/WhatsAppIcon";
import Print from "@/components/gp/Print";
import { cn } from "@/lib/utils";

export interface OccasionItem {
  slug: string;
  label: string;
  seeLabel: string;
  href: string;
  orderHref: string;
  main: { src: string; alt: string };
  insets: { src: string; alt: string }[];
}

const INSET_ROT = [5, -4];

/**
 * 4 · "Big words": the occasions in huge type; the word crossing the middle
 * of the screen (desktop scroll), or the one hovered / focused / tapped,
 * becomes active and the sticky photo card clip-reveals its cake.
 * Phones: a pill scroller above the card.
 */
export default function OccasionWords({
  items,
  listLabel,
  orderLabel,
  opensWa,
  heading,
}: {
  heading: React.ReactNode;
  items: OccasionItem[];
  listLabel: string;
  orderLabel: string;
  opensWa: string;
}) {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(-1);
  const wordRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLOListElement>(null);
  const activeRef = useRef(0);

  const select = (i: number) => {
    if (i === activeRef.current) return;
    setPrev(activeRef.current);
    activeRef.current = i;
    setActive(i);
  };

  // Desktop: the word crossing the middle line of the viewport is the active
  // one. An IntersectionObserver on a zero-height middle band: no layout reads
  // on scroll. (The list is display:none on phones, so nothing fires there.)
  useEffect(() => {
    const els = wordRefs.current.filter((el): el is HTMLButtonElement => Boolean(el));
    if (els.length === 0 || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).pop();
        if (hit) select(els.indexOf(hit.target as HTMLButtonElement));
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // The caption (label + CTAs) swaps halfway through the photo reveal.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown === active) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setShown(active), reduced ? 0 : 380);
    return () => window.clearTimeout(id);
  }, [active, shown]);

  const cur = items[shown] ?? items[0];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-12 md:gap-10">
      <div className="min-w-0 md:col-span-5">
      {heading}
      {/* Phones: pills */}
      <div className="-mx-4 mt-7 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:hidden">
        <div role="group" aria-label={listLabel} className="flex w-max gap-2">
          {items.map((o, i) => (
            <button
              key={o.slug}
              type="button"
              aria-pressed={i === active}
              onClick={(e) => {
                select(i);
                e.currentTarget.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
              }}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[0.9375rem] font-medium transition-colors duration-150",
                i === active ? "bg-gp-ink text-gp-cream" : "text-gp-ink ring-1 ring-inset ring-gp-ink/20"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: the big words */}
      <ol ref={listRef} aria-label={listLabel} className="hidden md:block md:pb-[10vh] md:pt-[5vh]">
        {items.map((o, i) => (
          <li key={o.slug}>
            <button
              ref={(el) => {
                wordRefs.current[i] = el;
              }}
              type="button"
              aria-pressed={i === active}
              onClick={() => select(i)}
              onFocus={() => select(i)}
              onPointerEnter={(e) => e.pointerType === "mouse" && select(i)}
              className={cn(
                "group relative flex w-full items-center gap-3 py-[3.2vh] text-start font-display text-[clamp(2.2rem,1.2rem+2.3vw,3.6rem)] font-semibold leading-[1] tracking-[-0.04em] transition-colors duration-300 ease-gp rtl:leading-[1.3] rtl:tracking-normal",
                i === active ? "text-gp-ink" : "text-gp-ink/50 hover:text-gp-ink/70"
              )}
            >
              <span>{o.label}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full bg-gp-raspberry transition-[transform,opacity] duration-300 ease-gp",
                  i === active ? "scale-100 opacity-100" : "scale-0 opacity-0"
                )}
              />
            </button>
          </li>
        ))}
      </ol>
      </div>

      {/* The card (sticky on desktop) */}
      <div className="min-w-0 md:col-span-7">
        <div className="md:sticky md:top-[calc(var(--gp-header-h)+max(1.5rem,(100svh-var(--gp-header-h)-min(76svh,680px))/2))]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[30px] bg-gp-ink/10 md:aspect-auto md:h-[min(76svh,680px)] md:rounded-[36px]">
            {/* Only the active photo and the one it covers are mounted (and loaded). */}
            {items.map((o, i) =>
              i !== active && i !== prev ? null : (
              <div
                key={o.slug}
                aria-hidden={i !== active}
                className="hv2-occ-photo absolute inset-0"
                data-state={i === active ? "on" : "prev"}
              >
                <Image
                  src={o.main.src}
                  alt={i === active ? o.main.alt : ""}
                  fill
                  sizes="(min-width: 768px) 54vw, 92vw"
                  className="object-cover"
                  style={{ objectPosition: "50% 45%" }}
                />
              </div>
              )
            )}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[58%] bg-gradient-to-t from-gp-ink/80 via-gp-ink/35 to-transparent"
            />

            {cur.insets.length > 0 ? (
              <div
                key={`insets-${cur.slug}`}
                className="hv2-occ-insets pointer-events-none absolute end-3 top-3 flex w-[34%] max-w-[190px] flex-col md:end-6 md:top-6"
              >
                {cur.insets.map((p, j) => (
                  <Print
                    key={p.src}
                    src={p.src}
                    alt=""
                    sizes="(min-width: 768px) 190px, 30vw"
                    rotate={INSET_ROT[j] ?? 0}
                    aspect="1 / 1"
                    frame="polaroid"
                    className={cn(j > 0 && "-mt-[18%] ms-[14%]")}
                  />
                ))}
              </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 z-[4] p-5 text-gp-cream md:p-9">
              <p
                className="font-display text-[clamp(1.75rem,1.2rem+1.6vw,2.6rem)] font-semibold leading-[1] tracking-[-0.035em] rtl:leading-[1.3] rtl:tracking-normal"
              >
                {cur.label}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <a
                  href={cur.orderHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2.5 rounded-full bg-gp-raspberry px-6 text-[0.9375rem] font-semibold text-gp-cream shadow-gp-chip transition-transform duration-150 ease-gp active:scale-[0.97]"
                >
                  <WhatsAppIcon className="h-5 w-5 shrink-0" />
                  {orderLabel}
                  <span className="sr-only"> ({opensWa})</span>
                </a>
                <Link
                  href={cur.href}
                  className="group inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-gp-cream underline decoration-gp-cream/40 underline-offset-[6px] hover:decoration-gp-cream"
                >
                  {cur.seeLabel}
                  <ArrowRight aria-hidden="true" className="h-4 w-4 rtl:-scale-x-100" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
