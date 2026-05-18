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
    eyebrow: "Notre Catalogue",
    title: "Pièces & Créations",
    lead: "L'archive complète de l'atelier. Chaque pièce est unique, façonnée à la main, sur commande.",
    all: "Tous",
    results: (n: number) => `${n} pièce${n !== 1 ? "s" : ""}`,
    empty: "Le catalogue se remplit. Revenez bientôt.",
    noResults: "Aucune pièce dans cette catégorie pour l'instant.",
    order: "Commander",
    greeting: "Bonjour Gateaux Patience ! Je suis intéressé(e) par :",
  },
  ar: {
    eyebrow: "معرضنا",
    title: "قطعنا وإبداعاتنا",
    lead: "الأرشيف الكامل للورشة. كل قطعة فريدة، مصنوعة يدوياً، حسب الطلب.",
    all: "الكل",
    results: (n: number) => `${n} قطعة`,
    empty: "المعرض قيد التحضير. عودوا قريباً.",
    noResults: "لا توجد قطع في هذه الفئة حالياً.",
    order: "اطلب",
    greeting: "مرحباً Gateaux Patience! أنا مهتم/ة بـ:",
  },
  en: {
    eyebrow: "Our Catalogue",
    title: "Pieces & Creations",
    lead: "The atelier's complete archive. Every piece is unique, handmade to order.",
    all: "All",
    results: (n: number) => `${n} piece${n !== 1 ? "s" : ""}`,
    empty: "The catalogue is taking shape. Come back soon.",
    noResults: "No pieces in this category yet.",
    order: "Order",
    greeting: "Hello Gateaux Patience! I'm interested in:",
  },
};

function CakeCard({ cake, locale, index }: { cake: Cake; locale: string; index: number }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });
  const tr = cake.translations[locale as Locale] ?? cake.translations.fr;
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const detailHref = `${prefix}/galerie/${cake.slug}`;
  const isRTL = locale === "ar";
  const whatsappUrl = `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `${copy.greeting} ${tr.title}`
  )}`;

  return (
    <article
      ref={ref}
      className={cn(
        "group transition-all duration-[1000ms] ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      <Link
        href={detailHref}
        className="relative block aspect-[4/5] overflow-hidden bg-[#F4ECE3]"
      >
        <Image
          src={cake.images[0]}
          alt={tr.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />
        {cake.images.length > 1 && (
          <div className="absolute top-3 right-3 text-[10px] tracking-[0.2em] uppercase text-white/90 px-2 py-1 bg-black/30 backdrop-blur-sm">
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
          className="absolute bottom-3 right-3 flex items-center justify-center gap-1.5 w-11 h-11 md:w-auto md:h-auto md:px-3.5 md:py-2 rounded-full bg-[#25D366] text-white shadow hover:bg-[#1ebd5c] hover:scale-105 transition-all"
        >
          <MessageCircle size={15} />
          <span className="hidden md:inline text-[10px] font-semibold tracking-wider uppercase">
            {copy.order}
          </span>
        </a>
      </Link>
      <Link href={detailHref} className={cn("block pt-4", isRTL && "text-right")}>
        <p className="text-[9px] md:text-[10px] tracking-[0.35em] uppercase text-charcoal-lighter mb-2">
          {cake.categoryLabel[locale as Locale] ?? cake.categoryLabel.fr}
        </p>
        <h3 className="font-playfair text-xl text-charcoal leading-tight group-hover:text-rose transition-colors">
          {tr.title}
        </h3>
        {(cake.persons || cake.pieces) && (
          <p className="mt-2 text-xs text-charcoal-light font-playfair italic">
            {cake.persons ? (locale === "ar" ? `لـ ${cake.persons}` : locale === "en" ? `for ${cake.persons}` : `pour ${cake.persons}`) : ""}
            {cake.persons && cake.pieces ? " · " : ""}
            {cake.pieces ? `${cake.pieces} ${locale === "ar" ? "حصة" : "portions"}` : ""}
          </p>
        )}
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
      {/* Editorial page header */}
      <header className="pt-32 pb-16 md:pt-40 md:pb-20 bg-[#FDF8F2] border-b border-charcoal/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className={cn("max-w-3xl", isRTL ? "ml-auto text-right" : "")}>
            <p className="text-[10px] tracking-[0.4em] uppercase text-charcoal-lighter mb-5">
              {copy.eyebrow}
            </p>
            <h1 className="font-playfair text-charcoal text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
              {copy.title}
            </h1>
            <p className="mt-6 text-charcoal-light text-base md:text-lg font-playfair italic max-w-xl">
              {copy.lead}
            </p>
          </div>
        </div>
      </header>

      {/* Filter — minimal typographic chips */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-charcoal/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4">
          <div
            className={cn(
              "flex items-center gap-1 md:gap-2 overflow-x-auto scrollbar-hide",
              isRTL && "flex-row-reverse"
            )}
          >
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "shrink-0 text-[10px] md:text-[11px] tracking-[0.3em] uppercase px-3 md:px-4 py-2 transition-colors whitespace-nowrap",
                activeCategory === "all"
                  ? "text-charcoal border-b border-rose"
                  : "text-charcoal-lighter hover:text-charcoal border-b border-transparent"
              )}
            >
              {copy.all}
            </button>
            {usableCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.slug)}
                className={cn(
                  "shrink-0 text-[10px] md:text-[11px] tracking-[0.3em] uppercase px-3 md:px-4 py-2 transition-colors whitespace-nowrap",
                  activeCategory === c.slug
                    ? "text-charcoal border-b border-rose"
                    : "text-charcoal-lighter hover:text-charcoal border-b border-transparent"
                )}
              >
                {c.labels[locale as Locale] ?? c.labels.fr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <p
            className={cn(
              "text-[10px] tracking-[0.3em] uppercase text-charcoal-lighter mb-10 md:mb-14",
              isRTL && "text-right"
            )}
          >
            {copy.results(filtered.length)}
          </p>

          {filtered.length === 0 ? (
            <div className="py-32 text-center">
              <p className="font-playfair italic text-charcoal-light text-xl">
                {cakes.length === 0 ? copy.empty : copy.noResults}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14 md:gap-x-8 md:gap-y-20">
              {filtered.map((cake, i) => (
                <CakeCard key={cake.id} cake={cake} locale={locale} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
