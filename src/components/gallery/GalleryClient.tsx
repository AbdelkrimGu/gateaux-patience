"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cake, Locale } from "@/lib/cakes-data";
import type { Category } from "@/lib/db-types";
import { CONTACT } from "@/lib/constants";

const COPY = {
  fr: {
    eyebrow: "Archive",
    title: "Catalogue intégral",
    sub: "Toutes les pièces. Toutes les catégories.",
    all: "Tout",
    results: (n: number) => `${String(n).padStart(2, "0")} pièce${n !== 1 ? "s" : ""}`,
    empty: "L'archive est en cours de constitution.",
    noResults: "Aucune pièce dans cette catégorie.",
    order: "Commander",
    greeting: "Bonjour Gateaux Patience ! Je suis intéressé(e) par :",
  },
  ar: {
    eyebrow: "الأرشيف",
    title: "الكاتالوغ الكامل",
    sub: "كل القطع. كل الفئات.",
    all: "الكل",
    results: (n: number) => `${String(n).padStart(2, "0")} قطعة`,
    empty: "الأرشيف قيد التحضير.",
    noResults: "لا توجد قطع في هذه الفئة.",
    order: "اطلب",
    greeting: "مرحباً Gateaux Patience! أنا مهتم/ة بـ:",
  },
  en: {
    eyebrow: "Archive",
    title: "Complete Catalogue",
    sub: "Every piece. Every category.",
    all: "All",
    results: (n: number) => `${String(n).padStart(2, "0")} piece${n !== 1 ? "s" : ""}`,
    empty: "The archive is being built.",
    noResults: "No pieces in this category.",
    order: "Order",
    greeting: "Hello Gateaux Patience! I'm interested in:",
  },
};

function Card({ cake, locale, index }: { cake: Cake; locale: string; index: number }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });
  const tr = cake.translations[locale as Locale] ?? cake.translations.fr;
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const detailHref = `${prefix}/galerie/${cake.slug}`;
  const whatsappUrl = `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `${copy.greeting} ${tr.title}`
  )}`;

  return (
    <article
      ref={ref}
      className={cn(
        "group transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: `${Math.min(index * 50, 350)}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-[#F5F1EB]">
        <Link href={detailHref} className="block absolute inset-0">
          <Image
            src={cake.images[0]}
            alt={tr.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </Link>
        {cake.images.length > 1 && (
          <div className="absolute top-3 right-3 text-white text-[9px] tracking-[0.3em] uppercase font-semibold mix-blend-difference">
            +{cake.images.length - 1}
          </div>
        )}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={copy.order}
          aria-label={copy.order}
          className="absolute bottom-3 right-3 z-10 flex items-center justify-center gap-2 w-11 h-11 md:w-auto md:h-auto md:px-3.5 md:py-2 bg-[#25D366] text-white hover:bg-[#1ebd5c] hover:scale-105 transition-all"
        >
          <MessageCircle size={14} />
          <span className="hidden md:inline text-[10px] tracking-[0.25em] uppercase font-semibold">
            {copy.order}
          </span>
        </a>
      </div>
      <Link href={detailHref} className="block pt-4">
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <p className="text-charcoal/50 text-[9px] tracking-[0.35em] uppercase">
            {cake.categoryLabel[locale as Locale] ?? cake.categoryLabel.fr}
          </p>
          <span className="text-charcoal/40 text-[9px] tracking-[0.25em]">
            № {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3 className="font-playfair text-charcoal text-lg leading-tight group-hover:underline underline-offset-4 decoration-rose decoration-1">
          {tr.title}
        </h3>
      </Link>
    </article>
  );
}

export default function GalleryClient({
  cakes,
  categories,
}: {
  cakes: Cake[];
  categories: Category[];
}) {
  const locale = useLocale();
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const isRTL = locale === "ar";
  const searchParams = useSearchParams();
  const initialCategory = (() => {
    const q = searchParams.get("category");
    if (q && categories.some((c) => c.slug === q)) return q;
    return "all";
  })();
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const visible = cakes.filter((c) => c.images.length > 0);
  const filtered =
    activeCategory === "all" ? visible : visible.filter((c) => c.category === activeCategory);
  const slugsInUse = new Set(visible.map((c) => c.category));
  const usableCategories = categories.filter((c) => slugsInUse.has(c.slug));

  return (
    <>
      {/* Stark, archival header */}
      <header className="pt-32 md:pt-40 pb-12 md:pb-16 bg-white border-b border-charcoal/15">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <div className={cn(isRTL ? "text-right" : "")}>
            <p className="text-charcoal/50 text-[10px] md:text-[11px] tracking-[0.35em] uppercase font-semibold mb-3 md:mb-4">
              I. · {copy.eyebrow}
            </p>
            <h1 className="font-playfair text-charcoal text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight max-w-4xl">
              {copy.title}
            </h1>
            <p className="mt-6 md:mt-8 text-charcoal/70 text-sm md:text-base max-w-xl">
              {copy.sub}
            </p>
          </div>
        </div>
      </header>

      {/* Filter — typographic only, sharp underlines */}
      <div className="sticky top-16 z-30 bg-white border-b border-charcoal/15">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-4">
          <div
            className={cn(
              "flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide",
              isRTL && "flex-row-reverse"
            )}
          >
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "shrink-0 text-[10px] md:text-[11px] tracking-[0.35em] uppercase font-semibold transition-colors whitespace-nowrap pb-1",
                activeCategory === "all"
                  ? "text-charcoal border-b border-rose"
                  : "text-charcoal/50 hover:text-charcoal border-b border-transparent"
              )}
            >
              {copy.all}
            </button>
            {usableCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.slug)}
                className={cn(
                  "shrink-0 text-[10px] md:text-[11px] tracking-[0.35em] uppercase font-semibold transition-colors whitespace-nowrap pb-1",
                  activeCategory === c.slug
                    ? "text-charcoal border-b border-rose"
                    : "text-charcoal/50 hover:text-charcoal border-b border-transparent"
                )}
              >
                {c.labels[locale as Locale] ?? c.labels.fr}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <p
            className={cn(
              "text-charcoal/50 text-[10px] tracking-[0.35em] uppercase font-semibold mb-10 md:mb-14",
              isRTL && "text-right"
            )}
          >
            {copy.results(filtered.length)}
          </p>

          {filtered.length === 0 ? (
            <div className="py-32 text-center">
              <p className="font-playfair text-charcoal/60 text-2xl">
                {cakes.length === 0 ? copy.empty : copy.noResults}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-12 md:gap-y-16">
              {filtered.map((cake, i) => (
                <Card key={cake.id} cake={cake} locale={locale} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
