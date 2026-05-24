"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/constants";
import type { Cake, CategoryImageGroup, Locale } from "@/lib/cakes-data";

interface Props {
  stories: Cake[];
  occasions: CategoryImageGroup[];
}

const STORY_DURATION_MS = 5000;
const TICK_MS = 60;
const TAP_THRESHOLD_MS = 220;

function localized(locale: string, fr: string, ar: string, en: string) {
  if (locale === "ar") return ar;
  if (locale === "en") return en;
  return fr;
}

export default function StoriesHero({ stories, occasions }: Props) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const prefix = locale === "fr" ? "" : `/${locale}`;

  const visible = stories.filter((c) => c.images.length > 0).slice(0, 6);
  const tiles = occasions.slice(0, 4);

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ t: number; x: number } | null>(null);

  // Reset progress whenever the active story changes
  useEffect(() => {
    setProgress(0);
  }, [index]);

  // Auto-advance ticker
  useEffect(() => {
    if (paused || visible.length === 0) return;
    const id = setInterval(() => {
      setProgress((p) => {
        const step = (TICK_MS / STORY_DURATION_MS) * 100;
        if (p + step >= 100) {
          setIndex((i) => (i + 1) % visible.length);
          return 0;
        }
        return p + step;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [paused, visible.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + visible.length) % visible.length);
  }, [visible.length]);
  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % visible.length);
  }, [visible.length]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Don't intercept taps on the explicit "view cake" CTA inside the story
    if ((e.target as HTMLElement).closest("[data-story-action]")) return;
    pointerStart.current = { t: Date.now(), x: e.clientX };
    setPaused(true);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-story-action]")) return;
    const start = pointerStart.current;
    pointerStart.current = null;
    setPaused(false);
    if (!start) return;
    const dt = Date.now() - start.t;
    if (dt < TAP_THRESHOLD_MS) {
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect) return;
      const half = rect.left + rect.width / 2;
      const leftHalf = e.clientX < half;
      // In RTL, swap left/right semantics so "tap forward" still feels natural
      if (leftHalf !== isRTL) goPrev();
      else goNext();
    }
  };
  const onPointerLeave = () => {
    pointerStart.current = null;
    setPaused(false);
  };

  if (visible.length === 0) return null;

  const active = visible[index];
  const activeTr = active.translations[locale as Locale] ?? active.translations.fr;
  const activeHref = `${prefix}/galerie/${active.slug}`;
  const activeCategoryLabel =
    active.categoryLabel[locale as Locale] ?? active.categoryLabel.fr;

  const cityLabel = localized(
    locale,
    "Cake Designer à Sidi Bel Abbès",
    "مصممة كعك في سيدي بلعباس",
    "Cake Designer in Sidi Bel Abbès"
  );
  const occasionPrompt = localized(
    locale,
    "Pour quelle occasion ?",
    "ما هي المناسبة ؟",
    "What's the occasion?"
  );
  const viewCakeLabel = localized(locale, "Voir ce gâteau", "اكتشف الكعكة", "View this cake");
  const whatsappLabel = localized(
    locale,
    "Discuter sur WhatsApp",
    "تواصل عبر واتساب",
    "Chat on WhatsApp"
  );
  const whatsappHref = `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`;

  return (
    <section className="relative min-h-screen flex flex-col bg-gradient-to-br from-[#FFF8F3] via-[#FFF0E8] to-[#FDE8E8] overflow-hidden">
      {/* Soft glow blobs */}
      <div
        className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #C9727A, transparent)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -left-32 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }}
        aria-hidden="true"
      />

      <div className="container-custom relative z-10 w-full pt-24 md:pt-28 pb-20">
        {/* Heading */}
        <div className="flex justify-center mb-6 md:mb-8">
          <h1 className="section-badge font-medium">
            <Sparkles size={13} className="text-rose" />
            <span>{cityLabel}</span>
          </h1>
        </div>

        {/* Phone-shaped story frame */}
        <div className="flex justify-center">
          <div
            ref={frameRef}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            className="relative w-full max-w-[340px] aspect-[9/16] rounded-[22px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(201,114,122,0.55)] ring-[3px] ring-charcoal/85 bg-charcoal select-none touch-none"
            role="region"
            aria-label="Story carousel"
          >
            {/* Active story image */}
            {visible.map((cake, i) => {
              const tr = cake.translations[locale as Locale] ?? cake.translations.fr;
              return (
                <Image
                  key={cake.id}
                  src={cake.images[0]}
                  alt={tr.title}
                  fill
                  priority={i === 0}
                  sizes="340px"
                  className={cn(
                    "object-cover transition-opacity duration-300",
                    i === index ? "opacity-100" : "opacity-0"
                  )}
                />
              );
            })}

            {/* Gradient overlays for legibility (top + bottom) */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

            {/* Progress segments */}
            <div className="absolute top-3 left-3 right-3 flex gap-1.5 z-20">
              {visible.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden"
                >
                  <div
                    className="h-full bg-white"
                    style={{
                      width:
                        i < index
                          ? "100%"
                          : i === index
                          ? `${progress}%`
                          : "0%",
                      transition: i === index ? "none" : "width 200ms",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Brand pill, top */}
            <div className="absolute top-8 left-3 right-3 flex items-center gap-2 z-20 mt-1">
              <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-white shadow">
                <Image
                  src="/Logo/Logo-Photoroom.png"
                  alt=""
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white text-[12px] font-semibold drop-shadow">
                Gateaux Patience
              </span>
            </div>

            {/* Caption */}
            <div className="absolute inset-x-4 bottom-4 z-20 flex flex-col gap-2 text-white">
              <span className="self-start px-2.5 py-0.5 rounded-full bg-white/95 text-rose text-[11px] font-semibold backdrop-blur-sm shadow-sm">
                {activeCategoryLabel}
              </span>
              <h3 className="font-playfair text-xl font-bold leading-tight line-clamp-2 drop-shadow-lg">
                {activeTr.title}
              </h3>
              <Link
                href={activeHref}
                data-story-action
                className="self-start inline-flex items-center gap-1.5 mt-1 px-3.5 py-1.5 rounded-full bg-white text-charcoal text-xs font-semibold shadow-md hover:bg-rose hover:text-white transition-colors"
              >
                {viewCakeLabel}
                <ArrowRight size={13} className={isRTL ? "rotate-180" : ""} />
              </Link>
            </div>
          </div>
        </div>

        {/* Occasion picker */}
        {tiles.length > 0 && (
          <div className="mt-10 md:mt-12">
            <p
              className={cn(
                "font-playfair text-lg md:text-xl font-semibold text-charcoal text-center mb-4",
                isRTL && "lg:text-right"
              )}
            >
              {occasionPrompt}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
              {tiles.map((tile) => {
                const label =
                  tile.category.labels[locale as Locale] ?? tile.category.labels.fr;
                const img = tile.images[0];
                return (
                  <Link
                    key={tile.category.id}
                    href={`${prefix}/galerie?category=${tile.category.slug}`}
                    className="group relative aspect-square rounded-2xl overflow-hidden shadow-cake hover:shadow-cake-hover ring-1 ring-rose/15 transition-all"
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt={label}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-rose/40 to-gold/40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <h4 className="font-playfair text-white font-bold text-sm md:text-base leading-tight drop-shadow-md line-clamp-2">
                        {label}
                      </h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* WhatsApp CTA — pastel, subtle */}
        <div className="flex justify-center mt-10">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose/10 text-rose font-medium ring-1 ring-rose/20 hover:bg-rose/15 transition-colors"
          >
            <MessageCircle size={16} />
            <span>{whatsappLabel}</span>
          </a>
        </div>
      </div>

      {/* Bottom wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
