"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import type { Cake, Locale } from "@/lib/cakes-data";

interface Props {
  cakes: Cake[];
}

const COPY = {
  fr: {
    place: "Atelier · Sidi Bel Abbès",
    cta: "Découvrir cette pièce",
    catalog: "Voir le catalogue",
  },
  ar: {
    place: "ورشة · سيدي بلعباس",
    cta: "اكتشف هذه القطعة",
    catalog: "تصفح المعرض",
  },
  en: {
    place: "Atelier · Sidi Bel Abbès",
    cta: "View this piece",
    catalog: "Browse the catalogue",
  },
};

export default function HeroSection({ cakes }: Props) {
  const locale = useLocale();
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const isRTL = locale === "ar";

  const visible = cakes.filter((c) => c.images.length > 0).slice(0, 5);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (visible.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % visible.length);
    }, 7000);
    return () => clearInterval(id);
  }, [visible.length]);

  if (visible.length === 0) {
    return (
      <section className="relative h-screen w-full overflow-hidden bg-[#1A1614] flex items-center justify-center">
        <div className="text-center text-white/80">
          <p className="text-[10px] tracking-[0.3em] uppercase mb-4">
            Gateaux Patience
          </p>
          <h1 className="font-playfair text-5xl md:text-7xl font-bold">L&apos;Atelier</h1>
          <p className="mt-6 text-sm text-white/50">{copy.place}</p>
        </div>
      </section>
    );
  }

  const current = visible[index];
  const tr = current.translations[locale as Locale] ?? current.translations.fr;
  const categoryLabel = current.categoryLabel[locale as Locale] ?? current.categoryLabel.fr;

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#1A1614]">
      {/* Stacked images for crossfade — all mounted so the next swap is instant */}
      {visible.map((cake, i) => (
        <Image
          key={cake.id}
          src={cake.images[0]}
          alt={cake.translations.fr.title}
          fill
          priority={i === 0}
          className={cn(
            "object-cover transition-opacity duration-[1500ms] ease-in-out",
            i === index ? "opacity-100" : "opacity-0"
          )}
          sizes="100vw"
        />
      ))}

      {/* Editorial gradient — darker at edges, transparent in centre so the cake breathes */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/65 pointer-events-none" />

      {/* Top mast */}
      <div
        className={cn(
          "absolute top-6 md:top-8 left-0 right-0 px-6 md:px-12 z-10 flex items-center justify-between",
          isRTL && "flex-row-reverse"
        )}
      >
        <p className="font-playfair italic text-white text-base md:text-lg">
          Gateaux Patience
        </p>
        <p className="text-white/70 text-[9px] md:text-[10px] tracking-[0.3em] uppercase">
          {copy.place}
        </p>
      </div>

      {/* Centre title block */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10 pointer-events-none">
        <p className="text-white/70 text-[9px] md:text-[10px] tracking-[0.4em] uppercase mb-5 md:mb-8">
          {categoryLabel}
        </p>
        <h1 className="font-playfair text-white text-[42px] md:text-7xl lg:text-[88px] font-bold leading-[1.05] max-w-4xl tracking-tight">
          {tr.title}
        </h1>
        <div className="mt-8 md:mt-10 h-px w-10 bg-gold pointer-events-auto" />
        <Link
          href={`${prefix}/galerie/${current.slug}`}
          className="mt-5 md:mt-6 text-white text-[10px] md:text-[11px] tracking-[0.3em] uppercase pb-1 border-b border-white/40 hover:border-gold hover:text-gold transition-colors pointer-events-auto"
        >
          {copy.cta}
        </Link>
      </div>

      {/* Bottom row — index + catalogue cue */}
      <div
        className={cn(
          "absolute bottom-6 md:bottom-8 left-0 right-0 px-6 md:px-12 z-10 flex items-end justify-between",
          isRTL && "flex-row-reverse"
        )}
      >
        <p className="font-playfair italic text-white/70 text-sm md:text-base">
          {String(index + 1).padStart(2, "0")} / {String(visible.length).padStart(2, "0")}
        </p>
        <Link
          href={`${prefix}/galerie`}
          className="text-white/90 text-[9px] md:text-[10px] tracking-[0.3em] uppercase hover:text-gold transition-colors flex items-center gap-2"
        >
          {copy.catalog}
          <span className="inline-block animate-bounce">↓</span>
        </Link>
      </div>

      {/* Vertical hairline dots showing position — desktop only, like a film strip */}
      <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-2 z-10">
        {visible.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Image ${i + 1}`}
            className={cn(
              "w-px h-6 transition-all",
              i === index ? "bg-gold h-10" : "bg-white/40 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </section>
  );
}
