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
    eyebrow: "La Collection",
    title: "Toutes les pièces",
    blurb: "L'intégrale de l'atelier. Chaque pièce a sa fiche, son histoire.",
    all: "Toutes",
    results: (n: number) => `${String(n).padStart(2, "0")} pièce${n !== 1 ? "s" : ""}`,
    empty: "La collection s'ouvre prochainement.",
    noResults: "Aucune pièce dans ce salon pour l'instant.",
    order: "Commander",
    greeting: "Bonjour Gateaux Patience ! Je suis intéressé(e) par :",
  },
  ar: {
    eyebrow: "المجموعة",
    title: "كل القطع",
    blurb: "كامل أرشيف الورشة. لكل قطعة ملفها، قصتها.",
    all: "الكل",
    results: (n: number) => `${String(n).padStart(2, "0")} قطعة`,
    empty: "المجموعة قيد الفتح قريباً.",
    noResults: "لا توجد قطع في هذا الصالون حالياً.",
    order: "اطلب",
    greeting: "مرحباً Gateaux Patience! أنا مهتم/ة بـ:",
  },
  en: {
    eyebrow: "The Collection",
    title: "All pieces",
    blurb: "The full atelier archive. Each piece has its label, its story.",
    all: "All",
    results: (n: number) => `${String(n).padStart(2, "0")} piece${n !== 1 ? "s" : ""}`,
    empty: "The collection opens soon.",
    noResults: "No pieces in this room yet.",
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
        "group transition-all duration-[900ms]",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      <div className="relative">
        <div className="absolute -inset-[2px] border border-gold/25 group-hover:border-gold/60 transition-colors pointer-events-none" />
        <div className="relative aspect-[4/5] overflow-hidden bg-[#1A1410]">
          <Link href={detailHref} className="block absolute inset-0">
            <Image
              src={cake.images[0]}
              alt={tr.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-[1500ms] group-hover:scale-[1.04]"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 35%, rgba(15,10,8,0.5) 100%)",
              }}
            />
          </Link>
          {cake.images.length > 1 && (
            <div className="absolute top-3 right-3 text-gold/70 text-[9px] tracking-[0.3em] uppercase pointer-events-none">
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
            className="absolute bottom-3 right-3 z-10 flex items-center justify-center gap-1.5 w-11 h-11 md:w-auto md:h-auto md:px-3.5 md:py-2 rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:bg-[#1ebd5c] hover:scale-105 transition-all"
          >
            <MessageCircle size={14} />
            <span className="hidden md:inline text-[10px] tracking-[0.2em] uppercase font-semibold">
              {copy.order}
            </span>
          </a>
        </div>
      </div>
      <Link href={detailHref} className="block pt-5 text-center">
        <p className="text-gold/70 text-[9px] md:text-[10px] tracking-[0.4em] uppercase mb-2">
          {cake.categoryLabel[locale as Locale] ?? cake.categoryLabel.fr}
        </p>
        <h3 className="font-playfair text-cream text-lg md:text-xl leading-tight group-hover:text-gold transition-colors">
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
      {/* Dramatic dark header */}
      <header className="relative pt-32 md:pt-40 pb-16 md:pb-20 bg-[#0F0A08] overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.2) 0%, rgba(15,10,8,0) 50%)",
          }}
        />
        <div className="relative max-w-[1440px] mx-auto px-6 md:px-12 text-center">
          <p className="text-gold/70 text-[10px] md:text-[11px] tracking-[0.5em] uppercase mb-5">
            — {copy.eyebrow} —
          </p>
          <h1 className="font-playfair text-cream text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight">
            {copy.title}
          </h1>
          <div className="my-7 flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-gold/40" />
            <span className="text-gold">◆</span>
            <div className="h-px w-16 bg-gold/40" />
          </div>
          <p className="text-cream/60 text-base md:text-lg font-playfair italic max-w-xl mx-auto">
            {copy.blurb}
          </p>
        </div>
      </header>

      {/* Filter — minimal, gold underline */}
      <div className="sticky top-16 z-30 bg-[#0F0A08]/95 backdrop-blur-md border-y border-gold/15">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-4">
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
                  ? "text-gold border-b border-gold"
                  : "text-cream/50 hover:text-cream border-b border-transparent"
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
                    ? "text-gold border-b border-gold"
                    : "text-cream/50 hover:text-cream border-b border-transparent"
                )}
              >
                {c.labels[locale as Locale] ?? c.labels.fr}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="bg-[#0F0A08] py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          <p
            className={cn(
              "text-gold/70 text-[10px] tracking-[0.4em] uppercase mb-10 md:mb-14 text-center"
            )}
          >
            {copy.results(filtered.length)}
          </p>

          {filtered.length === 0 ? (
            <div className="py-32 text-center">
              <div className="text-gold/40 text-2xl mb-4">◆</div>
              <p className="font-playfair italic text-cream/60 text-xl">
                {cakes.length === 0 ? copy.empty : copy.noResults}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14 md:gap-y-20">
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
