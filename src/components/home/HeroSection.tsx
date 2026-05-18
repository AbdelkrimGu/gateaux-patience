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
    masthead: "Atelier de Pâtisserie",
    place: "Sidi Bel Abbès · Algérie",
    since: "Depuis 2018",
    headline: ["Pièces", "uniques.", "Sur", "commande."],
    intro: "Une archive de créations façonnées à la main. Chaque pièce est conçue pour une occasion, pour une personne, pour un moment.",
    cta: "Parcourir l'archive",
    indexLabel: "Pièce",
    next: "Suivant",
  },
  ar: {
    masthead: "ورشة الحلويات",
    place: "سيدي بلعباس · الجزائر",
    since: "منذ 2018",
    headline: ["قطع", "فريدة.", "حسب", "الطلب."],
    intro: "أرشيف من الإبداعات المصنوعة يدوياً. كل قطعة مصممة لمناسبة، لشخص، للحظة.",
    cta: "تصفح الأرشيف",
    indexLabel: "قطعة",
    next: "التالي",
  },
  en: {
    masthead: "Patisserie Atelier",
    place: "Sidi Bel Abbès · Algeria",
    since: "Since 2018",
    headline: ["Unique", "pieces.", "On", "commission."],
    intro: "An archive of handmade creations. Each piece is conceived for an occasion, for a person, for a moment.",
    cta: "Browse the archive",
    indexLabel: "Piece",
    next: "Next",
  },
};

export default function HeroSection({ cakes }: Props) {
  const locale = useLocale();
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const visible = cakes.filter((c) => c.images.length > 0).slice(0, 6);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (visible.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % visible.length);
    }, 9000);
    return () => clearInterval(id);
  }, [visible.length]);

  return (
    <section className="relative min-h-screen w-full bg-[#F5F1EB] flex flex-col">
      {/* Top masthead — strict rule line spans the page */}
      <div className="border-b border-charcoal/15 pt-20">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between gap-4">
          <p className="text-charcoal text-[10px] md:text-[11px] tracking-[0.35em] uppercase font-semibold">
            {copy.masthead}
          </p>
          <div className="hidden md:flex items-center gap-6 text-charcoal/70 text-[10px] tracking-[0.3em] uppercase">
            <span>{copy.place}</span>
            <span className="w-px h-3 bg-charcoal/30" />
            <span>{copy.since}</span>
          </div>
          <p className="md:hidden text-charcoal/70 text-[9px] tracking-[0.3em] uppercase">
            {copy.since}
          </p>
        </div>
      </div>

      {/* Split layout: type on left, image on right */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left — typography */}
        <div className="md:w-[42%] flex flex-col justify-between px-6 md:px-10 py-12 md:py-16 border-b md:border-b-0 md:border-r border-charcoal/15">
          <div>
            <p className="text-charcoal/60 text-[10px] tracking-[0.4em] uppercase mb-6 md:mb-10">
              I. — {copy.indexLabel} {String(index + 1).padStart(2, "0")}
            </p>
            <h1 className="font-playfair text-charcoal text-[44px] md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95] tracking-tight">
              {copy.headline.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>
          </div>

          <div className="mt-12 md:mt-0 max-w-md">
            <div className="h-px w-24 bg-rose mb-6" />
            <p className="text-charcoal text-sm md:text-base leading-relaxed font-light mb-8">
              {copy.intro}
            </p>
            <Link
              href={`${prefix}/galerie`}
              className="inline-flex items-center gap-3 group text-charcoal hover:text-rose transition-colors"
            >
              <span className="text-[11px] tracking-[0.35em] uppercase font-semibold border-b border-charcoal pb-1 group-hover:border-rose">
                {copy.cta}
              </span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        {/* Right — single image, slow crossfade */}
        <div className="md:w-[58%] relative bg-charcoal min-h-[420px] md:min-h-0">
          {visible.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/60 font-playfair italic text-2xl">L&apos;Atelier</p>
            </div>
          ) : (
            <>
              {visible.map((cake, i) => (
                <Image
                  key={cake.id}
                  src={cake.images[0]}
                  alt={cake.translations.fr.title}
                  fill
                  priority={i === 0}
                  className={cn(
                    "object-cover transition-opacity duration-[2000ms] ease-in-out",
                    i === index ? "opacity-100" : "opacity-0"
                  )}
                  sizes="60vw"
                />
              ))}

              {/* Caption block — flat, sans-serif, bottom-left of image area */}
              <div className="absolute bottom-0 left-0 right-0 bg-charcoal/80 backdrop-blur-sm p-6 md:p-8 border-t border-white/10">
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <p className="text-white/60 text-[9px] md:text-[10px] tracking-[0.35em] uppercase mb-2">
                      {visible[index].categoryLabel[locale as Locale] ?? visible[index].categoryLabel.fr}
                    </p>
                    <Link
                      href={`${prefix}/galerie/${visible[index].slug}`}
                      className="font-playfair text-white text-2xl md:text-3xl leading-tight hover:text-rose-200 transition-colors"
                    >
                      {visible[index].translations[locale as Locale]?.title || visible[index].translations.fr.title}
                    </Link>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-1">
                      {String(index + 1).padStart(2, "0")} / {String(visible.length).padStart(2, "0")}
                    </p>
                    {visible.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIndex((i) => (i + 1) % visible.length)}
                        className="text-white/70 hover:text-white text-[10px] tracking-[0.3em] uppercase border-b border-white/30 hover:border-white pb-0.5"
                      >
                        {copy.next} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
