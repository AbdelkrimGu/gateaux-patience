"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cake, Locale } from "@/lib/cakes-data";
import { CONTACT } from "@/lib/constants";

const COPY = {
  fr: {
    sectionIndex: "II.",
    sectionLabel: "Catalogue",
    title: "Sélection",
    sub: "Six pièces choisies parmi les commandes récentes de l'atelier.",
    order: "Commander",
    viewAll: "Voir tout",
    greeting: "Bonjour Gateaux Patience ! Je suis intéressé(e) par :",
  },
  ar: {
    sectionIndex: "II.",
    sectionLabel: "المعرض",
    title: "مختارات",
    sub: "ست قطع مختارة من طلبات الورشة الأخيرة.",
    order: "اطلب",
    viewAll: "عرض الكل",
    greeting: "مرحباً Gateaux Patience! أنا مهتم/ة بـ:",
  },
  en: {
    sectionIndex: "II.",
    sectionLabel: "Catalogue",
    title: "Selection",
    sub: "Six pieces chosen from the atelier's recent commissions.",
    order: "Order",
    viewAll: "View all",
    greeting: "Hello Gateaux Patience! I'm interested in:",
  },
};

function Tile({ cake, locale, index }: { cake: Cake; locale: string; index: number }) {
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
        "group transition-all duration-700 ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-[#F5F1EB]">
        <Link href={detailHref} className="block absolute inset-0">
          <Image
            src={cake.images[0]}
            alt={tr.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </Link>

        {/* Index number top-left, pure typographic */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="text-white text-[10px] md:text-[11px] tracking-[0.35em] uppercase font-semibold mix-blend-difference">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Order button — square, not pill, modernist */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={copy.order}
          aria-label={copy.order}
          className="absolute bottom-3 right-3 z-10 flex items-center justify-center gap-2 w-11 h-11 md:w-auto md:h-auto md:px-4 md:py-2.5 bg-[#25D366] text-white hover:bg-[#1ebd5c] hover:scale-105 transition-all"
        >
          <MessageCircle size={15} />
          <span className="hidden md:inline text-[10px] tracking-[0.25em] uppercase font-semibold whitespace-nowrap">
            {copy.order}
          </span>
        </a>
      </div>

      <Link href={detailHref} className="block pt-5">
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <p className="text-charcoal/50 text-[9px] md:text-[10px] tracking-[0.35em] uppercase">
            {cake.categoryLabel[locale as Locale] ?? cake.categoryLabel.fr}
          </p>
          <span className="text-charcoal/40 text-[9px] tracking-[0.25em] uppercase">
            № {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3 className="font-playfair text-charcoal text-xl md:text-2xl leading-tight group-hover:underline underline-offset-4 decoration-rose decoration-1">
          {tr.title}
        </h3>
        {(cake.persons || cake.pieces) && (
          <p className="mt-3 text-charcoal/60 text-[11px] tracking-wide">
            {cake.length && cake.width
              ? `${cake.length}×${cake.width}${cake.height ? `×${cake.height}` : ""} cm`
              : ""}
            {cake.length && cake.width && (cake.persons || cake.pieces) ? " · " : ""}
            {cake.persons
              ? locale === "ar"
                ? `${cake.persons} أشخاص`
                : locale === "en"
                ? `${cake.persons} pers`
                : `${cake.persons} pers`
              : ""}
            {cake.persons && cake.pieces ? " · " : ""}
            {cake.pieces
              ? locale === "ar"
                ? `${cake.pieces} حصة`
                : `${cake.pieces} portions`
              : ""}
          </p>
        )}
      </Link>
    </article>
  );
}

export default function FeaturedCakes({ cakes }: { cakes: Cake[] }) {
  const locale = useLocale();
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const isRTL = locale === "ar";
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const visible = cakes.filter((c) => c.images.length > 0);
  if (visible.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-white border-t border-charcoal/10">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        {/* Section header — strict baseline grid */}
        <div
          ref={ref}
          className={cn(
            "flex items-end justify-between gap-8 pb-10 md:pb-16 border-b border-charcoal/15 transition-all duration-1000",
            isRTL ? "flex-row-reverse" : "",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div>
            <p className="text-charcoal/50 text-[10px] md:text-[11px] tracking-[0.35em] uppercase font-semibold mb-3 md:mb-4">
              {copy.sectionIndex} · {copy.sectionLabel}
            </p>
            <h2 className="font-playfair text-charcoal text-5xl md:text-7xl font-bold leading-[0.95] tracking-tight">
              {copy.title}
            </h2>
          </div>
          <p className="hidden md:block max-w-xs text-charcoal/70 text-sm leading-relaxed">
            {copy.sub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14 md:gap-x-8 md:gap-y-20 pt-12 md:pt-16">
          {visible.map((cake, i) => (
            <Tile key={cake.id} cake={cake} locale={locale} index={i} />
          ))}
        </div>

        <div className={cn("mt-16 md:mt-20 pt-8 border-t border-charcoal/15 flex", isRTL ? "justify-start" : "justify-end")}>
          <Link
            href={`${prefix}/galerie`}
            className="inline-flex items-center gap-3 group text-charcoal hover:text-rose transition-colors"
          >
            <span className="text-[11px] tracking-[0.35em] uppercase font-semibold border-b border-charcoal pb-1 group-hover:border-rose">
              {copy.viewAll}
            </span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
