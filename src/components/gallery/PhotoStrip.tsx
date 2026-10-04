"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/*
  Secondary photos: a swipeable strip (CSS scroll-snap, no carousel lib) and
  a fullscreen viewer in a native <dialog> (focus trap, Esc, focus return
  for free). The viewer is another scroll-snap row; pinch-zoom is the
  browser's own (touch-action), so no zoom library ships. Viewer images
  mount only while it is open.
*/

export interface PhotoStripLabels {
  title: string;
  open: string; // "Agrandir la photo {n} sur {total}" with {n}/{total} left in
  alt: string; // "{title}, photo {n}"
  viewer: string;
  close: string;
  prev: string;
  next: string;
  count: string; // "{n} sur {total}"
}

const fill = (s: string, n: number, total: number) => s.replace("{n}", String(n)).replace("{total}", String(total));

export function PhotoStrip({
  images,
  labels,
  ecrin,
}: {
  /** All photos of the cake; the strip shows images[1..], the viewer all. */
  images: string[];
  labels: PhotoStripLabels;
  ecrin?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const total = images.length;

  const show = (i: number) => {
    setIndex(i);
    setOpen(true);
    dialogRef.current?.showModal();
  };

  // Jump (no animation) to the tapped photo once the viewer has mounted.
  useEffect(() => {
    if (!open) return;
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({
      block: "nearest",
      inline: "start",
      behavior: "instant",
    });
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on open
  }, [open]);

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
    setIndex(Math.min(total - 1, Math.max(0, i)));
  }, [total]);

  const go = (delta: number) => {
    const track = trackRef.current;
    const next = Math.min(total - 1, Math.max(0, index + delta));
    (track?.children[next] as HTMLElement | undefined)?.scrollIntoView({
      block: "nearest",
      inline: "start",
      behavior: "instant",
    });
  };

  if (total < 2) return null;

  return (
    <section aria-labelledby="cake-photos" className="mt-10">
      <h2 id="cake-photos" className="type-band">
        {labels.title}
      </h2>
      <ul className="bleed mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] pb-2 [scrollbar-width:none] desk:mx-0 desk:px-0 [&::-webkit-scrollbar]:hidden">
        {images.slice(1).map((src, k) => {
          const i = k + 1;
          return (
            <li key={src} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => show(i)}
                aria-label={fill(labels.open, i + 1, total)}
                className={cn(
                  "press relative block aspect-[4/5] w-[38vw] max-w-[168px] overflow-hidden rounded-[14px] bg-tint desk:w-[150px]",
                  ecrin && "bezel"
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width: 900px) 150px, 38vw"
                  className="photo-grade object-cover"
                />
              </button>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={labels.viewer}
        onClose={() => setOpen(false)}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-paillette p-0 text-sucre backdrop:bg-paillette"
      >
        {open && (
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <p className="type-meta text-sucre/80" aria-live="polite">
                <bdi className="ltr">{fill(labels.count, index + 1, total)}</bdi>
              </p>
              <form method="dialog">
                <button
                  type="submit"
                  aria-label={labels.close}
                  className="press grid size-11 place-items-center rounded-pill bg-sucre/10 text-sucre hover:bg-sucre/20"
                >
                  <Icon name="close" size={22} />
                </button>
              </form>
            </div>
            <div
              ref={trackRef}
              onScroll={onScroll}
              className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {images.map((src, i) => (
                <div
                  key={src}
                  className="relative h-full w-full shrink-0 snap-center [touch-action:pan-x_pan-y_pinch-zoom]"
                >
                  <Image
                    src={src}
                    alt={fill(labels.alt, i + 1, total)}
                    fill
                    sizes="100vw"
                    loading={Math.abs(i - index) <= 1 ? "eager" : "lazy"}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
            <div className="hidden justify-center gap-3 py-4 desk:flex">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={index === 0}
                aria-label={labels.prev}
                className="press grid size-11 place-items-center rounded-pill bg-sucre/10 hover:bg-sucre/20 disabled:opacity-40"
              >
                <Icon name="back" size={22} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={index === total - 1}
                aria-label={labels.next}
                className="press grid size-11 place-items-center rounded-pill bg-sucre/10 hover:bg-sucre/20 disabled:opacity-40"
              >
                <Icon name="arrow" size={22} />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
