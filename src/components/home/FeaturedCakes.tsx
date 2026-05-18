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
    eyebrow: "Cabinet de Curiosités",
    title: "Les Pièces Maîtresses",
    blurb:
      "Une sélection de l'atelier. Chaque pièce est une commande, façonnée à la main, signée.",
    order: "Commander",
    viewAll: "Toutes les pièces",
    greeting: "Bonjour Gateaux Patience ! Je suis intéressé(e) par :",
  },
  ar: {
    eyebrow: "خزانة العجائب",
    title: "القطع الرئيسية",
    blurb: "مجموعة من الورشة. كل قطعة هي طلب، مصنوعة يدوياً، موقعة.",
    order: "اطلب",
    viewAll: "كل القطع",
    greeting: "مرحباً Gateaux Patience! أنا مهتم/ة بـ:",
  },
  en: {
    eyebrow: "Cabinet of Curiosities",
    title: "Signature Pieces",
    blurb: "A selection from the atelier. Each piece is a commission, handmade, signed.",
    order: "Order",
    viewAll: "All pieces",
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
        "group transition-all duration-[900ms]",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Framed portrait — gold thin border + warm vignette */}
      <div className="relative">
        <div className="absolute -inset-[3px] border border-gold/30 group-hover:border-gold/60 transition-colors pointer-events-none" />
        <div className="relative aspect-[4/5] overflow-hidden bg-[#1A1410]">
          <Link href={detailHref} className="block absolute inset-0">
            <Image
              src={cake.images[0]}
              alt={tr.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-[1500ms] group-hover:scale-[1.05]"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 35%, rgba(15,10,8,0.45) 100%)",
              }}
            />
          </Link>

          {/* Order button — green dot in the bottom corner */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={copy.order}
            aria-label={copy.order}
            className="absolute bottom-3 right-3 z-10 flex items-center justify-center gap-2 w-11 h-11 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.45)] hover:bg-[#1ebd5c] hover:scale-105 transition-all"
          >
            <MessageCircle size={15} />
            <span className="hidden md:inline text-[10px] tracking-[0.2em] uppercase font-semibold">
              {copy.order}
            </span>
          </a>
        </div>
      </div>

      {/* Caption — like a museum label */}
      <Link href={detailHref} className="block pt-7 text-center">
        <p className="text-gold/70 text-[9px] md:text-[10px] tracking-[0.4em] uppercase mb-2">
          {cake.categoryLabel[locale as Locale] ?? cake.categoryLabel.fr}
        </p>
        <h3 className="font-playfair text-cream text-xl md:text-2xl leading-tight group-hover:text-gold transition-colors">
          {tr.title}
        </h3>
        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="h-px w-6 bg-gold/30" />
          <span className="text-gold/60 text-[10px]">◆</span>
          <div className="h-px w-6 bg-gold/30" />
        </div>
        {(cake.persons || cake.pieces) && (
          <p className="mt-2 text-cream/50 text-xs tracking-wide font-playfair italic">
            {cake.persons ? (locale === "ar" ? `${cake.persons} أشخاص` : `${cake.persons} pers.`) : ""}
            {cake.persons && cake.pieces ? " · " : ""}
            {cake.pieces ? `${cake.pieces} ${locale === "ar" ? "حصة" : "portions"}` : ""}
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
    <section className="relative py-24 md:py-32 bg-[#0F0A08] overflow-hidden">
      {/* Warm wash */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.15) 0%, rgba(15,10,8,0) 50%)",
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-6 md:px-12">
        {/* Section header */}
        <div
          ref={ref}
          className={cn(
            "text-center max-w-2xl mx-auto mb-16 md:mb-20 transition-all duration-1000",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <p className="text-gold/70 text-[10px] md:text-[11px] tracking-[0.5em] uppercase mb-5">
            — {copy.eyebrow} —
          </p>
          <h2 className="font-playfair text-cream text-4xl md:text-6xl font-bold leading-tight">
            {copy.title}
          </h2>
          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-gold/40" />
            <span className="text-gold">◆</span>
            <div className="h-px w-16 bg-gold/40" />
          </div>
          <p className="text-cream/60 text-base md:text-lg max-w-xl mx-auto font-light">
            {copy.blurb}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12 lg:gap-16">
          {visible.map((cake, i) => (
            <Tile key={cake.id} cake={cake} locale={locale} index={i} />
          ))}
        </div>

        <div className={cn("mt-20 flex", isRTL ? "justify-start" : "justify-center")}>
          <Link
            href={`${prefix}/galerie`}
            className="inline-flex items-center gap-3 group border border-gold/50 text-cream px-7 py-3.5 hover:bg-gold hover:text-[#0F0A08] hover:border-gold transition-all"
          >
            <span className="font-playfair italic">{copy.viewAll}</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
