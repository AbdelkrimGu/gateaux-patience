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
    masthead: "Maison de Pâtisserie",
    badge: "Pièces de Caractère",
    blurb:
      "Une signature. Des pièces façonnées dans l'intimité de l'atelier, où chaque détail compte et chaque rencontre devient un souvenir.",
    cta: "Entrer dans la maison",
    pieceLabel: "Pièce",
  },
  ar: {
    masthead: "بيت الحلويات",
    badge: "قطع ذات طابع",
    blurb:
      "توقيع. قطع مصنوعة في حميمية الورشة، حيث كل تفصيل يهم وكل لقاء يصبح ذكرى.",
    cta: "ادخل البيت",
    pieceLabel: "قطعة",
  },
  en: {
    masthead: "House of Patisserie",
    badge: "Pieces of Character",
    blurb:
      "A signature. Pieces shaped in the intimacy of the atelier, where every detail counts and every encounter becomes a memory.",
    cta: "Enter the house",
    pieceLabel: "Piece",
  },
};

export default function HeroSection({ cakes }: Props) {
  const locale = useLocale();
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const visible = cakes.filter((c) => c.images.length > 0).slice(0, 5);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (visible.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % visible.length);
    }, 8000);
    return () => clearInterval(id);
  }, [visible.length]);

  const current = visible[index];

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#0F0A08]">
      {/* Warm radial spotlight wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(212,175,55,0.18) 0%, rgba(201,114,122,0.10) 25%, rgba(15,10,8,0) 60%)",
        }}
      />
      {/* Subtle grain via SVG noise — gives the dark its candle-room texture */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
        }}
      />

      {/* Top mast */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-20">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-5 flex items-center justify-between gap-4 border-b border-gold/15">
          <p className="font-playfair italic text-gold text-base md:text-lg">
            Gateaux Patience
          </p>
          <p className="text-cream/50 text-[9px] md:text-[10px] tracking-[0.4em] uppercase">
            {copy.masthead}
          </p>
        </div>
      </div>

      {/* Centre stage — image framed like a portrait */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-32">
        {visible.length > 0 && (
          <Link
            href={`${prefix}/galerie/${current.slug}`}
            className="block relative w-[280px] h-[360px] md:w-[420px] md:h-[540px] mb-10 group"
            aria-label={current.translations[locale as Locale]?.title || current.translations.fr.title}
          >
            {/* Gold frame */}
            <div
              className="absolute -inset-3 md:-inset-4 border border-gold/40"
              style={{ boxShadow: "0 0 60px rgba(212,175,55,0.15)" }}
            />
            <div className="absolute inset-0 overflow-hidden bg-[#1A1410]">
              {visible.map((cake, i) => (
                <Image
                  key={cake.id}
                  src={cake.images[0]}
                  alt={cake.translations.fr.title}
                  fill
                  priority={i === 0}
                  className={cn(
                    "object-cover transition-opacity duration-[2000ms]",
                    i === index ? "opacity-100" : "opacity-0"
                  )}
                  sizes="(max-width: 768px) 280px, 420px"
                />
              ))}
              {/* Vignette */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 30%, rgba(15,10,8,0.55) 100%)",
                }}
              />
            </div>
            {/* Inner caption — under the framed portrait */}
            <div className="absolute -bottom-12 md:-bottom-14 left-0 right-0 text-center">
              <p className="text-gold/80 text-[9px] md:text-[10px] tracking-[0.4em] uppercase">
                {String(index + 1).padStart(2, "0")} — {current.translations[locale as Locale]?.title || current.translations.fr.title}
              </p>
            </div>
          </Link>
        )}

        {/* Below: the brand statement */}
        <div className="relative mt-16 md:mt-20 max-w-3xl text-center">
          <p className="text-gold/70 text-[10px] md:text-[11px] tracking-[0.5em] uppercase mb-5">
            — {copy.badge} —
          </p>
          <h1 className="font-playfair text-cream text-[44px] md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight">
            Gateaux <span className="italic text-gold">Patience</span>
          </h1>
          <div className="my-7 flex items-center justify-center gap-3">
            <div className="h-px w-14 bg-gold/40" />
            <span className="text-gold text-base">◆</span>
            <div className="h-px w-14 bg-gold/40" />
          </div>
          <p className="text-cream/70 text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-9 font-light">
            {copy.blurb}
          </p>
          <Link
            href={`${prefix}/galerie`}
            className="inline-flex items-center gap-3 group border border-gold/50 text-cream px-7 py-3.5 hover:bg-gold hover:text-[#0F0A08] hover:border-gold transition-all"
          >
            <span className="font-playfair italic text-base">{copy.cta}</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>

      {/* Dot indicator at bottom */}
      {visible.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {visible.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Image ${i + 1}`}
              className={cn(
                "transition-all",
                i === index ? "w-8 h-px bg-gold" : "w-3 h-px bg-gold/30 hover:bg-gold/60"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
