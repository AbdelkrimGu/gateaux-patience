"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import type { Category, Locale } from "@/lib/db-types";

const COPY = {
  fr: { index: "III.", label: "Spécialités", title: "Par occasion" },
  ar: { index: "III.", label: "التخصصات", title: "حسب المناسبة" },
  en: { index: "III.", label: "Specialities", title: "By occasion" },
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
        "group block transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F1EB]">
        {category.image ? (
          <Image
            src={category.image}
            alt={label}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04] grayscale-[15%] group-hover:grayscale-0"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-charcoal/90">
            <span className="font-playfair text-white/30 text-7xl">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      <div className="pt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-playfair text-charcoal text-lg md:text-xl leading-tight group-hover:underline underline-offset-4 decoration-rose decoration-1">
          {label}
        </h3>
        <p className="text-charcoal/40 text-[9px] tracking-[0.3em] uppercase shrink-0">
          № {String(index + 1).padStart(2, "0")}
        </p>
      </div>
    </Link>
  );
}

export default function CategoriesSection({ categories }: { categories: Category[] }) {
  const locale = useLocale();
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const isRTL = locale === "ar";
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  if (categories.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-[#F5F1EB] border-t border-charcoal/10">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        <div
          ref={ref}
          className={cn(
            "pb-10 md:pb-16 border-b border-charcoal/15 transition-all duration-1000",
            isRTL ? "text-right" : "",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <p className="text-charcoal/50 text-[10px] md:text-[11px] tracking-[0.35em] uppercase font-semibold mb-3 md:mb-4">
            {copy.index} · {copy.label}
          </p>
          <h2 className="font-playfair text-charcoal text-5xl md:text-7xl font-bold leading-[0.95] tracking-tight">
            {copy.title}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-14 pt-12 md:pt-16">
          {categories.map((cat, i) => (
            <Tile key={cat.id} category={cat} locale={locale} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
