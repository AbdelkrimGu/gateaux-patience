"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import type { Category, Locale } from "@/lib/db-types";

const COPY = {
  fr: {
    eyebrow: "Les Salons",
    title: "Pour chaque occasion",
    blurb: "Choisissez le moment, nous façonnons la pièce.",
  },
  ar: {
    eyebrow: "الصالونات",
    title: "لكل مناسبة",
    blurb: "اختر اللحظة، ونحن نصنع القطعة.",
  },
  en: {
    eyebrow: "The Rooms",
    title: "For every occasion",
    blurb: "Choose the moment, we shape the piece.",
  },
};

function Tile({ category, locale, index }: { category: Category; locale: string; index: number }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const label = category.labels[locale as Locale] ?? category.labels.fr;
  const prefix = locale === "fr" ? "" : `/${locale}`;

  return (
    <Link
      ref={ref}
      href={`${prefix}/galerie?category=${category.slug}`}
      className={cn(
        "group block transition-all duration-1000",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative">
        <div className="absolute -inset-[3px] border border-gold/25 group-hover:border-gold/60 transition-colors pointer-events-none" />
        <div className="relative aspect-[5/6] overflow-hidden bg-[#1A1410]">
          {category.image ? (
            <Image
              src={category.image}
              alt={label}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-[1500ms] group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1A1410]">
              <span className="font-playfair italic text-gold/30 text-7xl">
                {label.charAt(0)}
              </span>
            </div>
          )}
          {/* Vignette + label gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(15,10,8,0.5) 100%), linear-gradient(to top, rgba(15,10,8,0.85) 0%, rgba(15,10,8,0.3) 35%, transparent 60%)",
            }}
          />

          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-center">
            <p className="text-gold/70 text-[9px] md:text-[10px] tracking-[0.4em] uppercase mb-2">
              № {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="font-playfair text-cream text-xl md:text-2xl leading-tight group-hover:text-gold transition-colors">
              {label}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CategoriesSection({ categories }: { categories: Category[] }) {
  const locale = useLocale();
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  if (categories.length === 0) return null;

  return (
    <section className="relative py-24 md:py-32 bg-[#0A0705] overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(201,114,122,0.15) 0%, rgba(10,7,5,0) 60%)",
        }}
      />
      <div className="relative max-w-[1440px] mx-auto px-6 md:px-12">
        <div
          ref={ref}
          className={cn(
            "text-center max-w-2xl mx-auto mb-16 transition-all duration-1000",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <p className="text-gold/70 text-[10px] md:text-[11px] tracking-[0.5em] uppercase mb-5">
            — {copy.eyebrow} —
          </p>
          <h2 className="font-playfair text-cream text-4xl md:text-5xl font-bold leading-tight">
            {copy.title}
          </h2>
          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gold/40" />
            <span className="text-gold">◆</span>
            <div className="h-px w-12 bg-gold/40" />
          </div>
          <p className="text-cream/60 text-base md:text-lg font-light italic font-playfair">
            {copy.blurb}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {categories.map((cat, i) => (
            <Tile key={cat.id} category={cat} locale={locale} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
