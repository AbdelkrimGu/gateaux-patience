"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { MessageCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cake, Locale } from "@/lib/cakes-data";
import { CONTACT } from "@/lib/constants";

const COPY = {
  fr: {
    sectionNumber: "I.",
    sectionTitle: "Le Catalogue",
    sectionLead:
      "Une sélection de pièces issues de l'atelier — chacune façonnée à la main, sur commande.",
    order: "Commander",
    request: "Commander cette pièce",
    portionsFor: (p: number) => `${p} portions`,
    personsFor: (p: number) => `pour ${p}`,
    viewAll: "Toutes les pièces",
    greeting: "Bonjour Gateaux Patience ! Je suis intéressé(e) par :",
  },
  ar: {
    sectionNumber: "I.",
    sectionTitle: "المعرض",
    sectionLead: "مجموعة من القطع المصنوعة يدوياً، حسب الطلب.",
    order: "اطلب",
    request: "اطلب هذه القطعة",
    portionsFor: (p: number) => `${p} حصة`,
    personsFor: (p: number) => `لـ ${p}`,
    viewAll: "كل القطع",
    greeting: "مرحباً Gateaux Patience! أنا مهتم/ة بـ:",
  },
  en: {
    sectionNumber: "I.",
    sectionTitle: "The Catalogue",
    sectionLead: "A selection from the atelier — each piece handmade to order.",
    order: "Order",
    request: "Order this piece",
    portionsFor: (p: number) => `${p} portions`,
    personsFor: (p: number) => `for ${p}`,
    viewAll: "All pieces",
    greeting: "Hello Gateaux Patience! I'm interested in:",
  },
};

function CatalogTile({
  cake,
  locale,
  prominent,
  index,
}: {
  cake: Cake;
  locale: string;
  prominent: boolean;
  index: number;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });
  const tr = cake.translations[locale as Locale] ?? cake.translations.fr;
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const isRTL = locale === "ar";
  const detailHref = `${prefix}/galerie/${cake.slug}`;
  const whatsappUrl = `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `${copy.greeting} ${tr.title}`
  )}`;

  return (
    <article
      ref={ref}
      className={cn(
        "group relative transition-all duration-[1200ms] ease-out",
        prominent ? "md:col-span-2 md:row-span-2" : "md:col-span-1",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      )}
      style={{ transitionDelay: `${Math.min(index * 90, 360)}ms` }}
    >
      <Link
        href={detailHref}
        className="block relative overflow-hidden bg-[#F4ECE3] aspect-[4/5]"
      >
        {cake.images[0] && (
          <Image
            src={cake.images[0]}
            alt={tr.title}
            fill
            sizes={prominent ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
            className="object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {/* Quiet WhatsApp pill (it's the ONLY chrome we put on the image) */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={copy.order}
          aria-label={copy.order}
          className="absolute bottom-4 right-4 flex items-center justify-center gap-1.5 w-11 h-11 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebd5c] hover:scale-105 active:scale-95 transition-all"
        >
          <MessageCircle size={15} />
          <span className="hidden md:inline text-[11px] font-semibold whitespace-nowrap tracking-wider uppercase">
            {copy.order}
          </span>
        </a>
      </Link>

      {/* Caption — magazine style: small uppercase category + serif title + thin rule + meta */}
      <Link href={detailHref} className={cn("block pt-5", isRTL && "text-right")}>
        <p className="text-[9px] md:text-[10px] tracking-[0.35em] uppercase text-charcoal-lighter mb-2">
          {cake.categoryLabel[locale as Locale] ?? cake.categoryLabel.fr}
        </p>
        <h3
          className={cn(
            "font-playfair text-charcoal leading-tight group-hover:text-rose transition-colors",
            prominent ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
          )}
        >
          {tr.title}
        </h3>
        <div className="mt-3 h-px w-8 bg-gold/60" />
        {(cake.persons || cake.pieces) && (
          <p className="mt-3 text-xs text-charcoal-light font-playfair italic">
            {cake.persons ? copy.personsFor(cake.persons) : ""}
            {cake.persons && cake.pieces ? " · " : ""}
            {cake.pieces ? copy.portionsFor(cake.pieces) : ""}
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
    <section className="py-24 md:py-32 bg-[#FDF8F2]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section header — magazine departments style */}
        <div
          ref={ref}
          className={cn(
            "max-w-2xl mb-16 md:mb-24 transition-all duration-1000",
            isRTL ? "ml-auto text-right" : "",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <div className={cn("flex items-baseline gap-4 mb-6", isRTL && "flex-row-reverse")}>
            <span className="font-playfair italic text-rose text-3xl md:text-4xl">
              {copy.sectionNumber}
            </span>
            <span className="text-[10px] tracking-[0.4em] uppercase text-charcoal-lighter">
              {copy.sectionTitle}
            </span>
          </div>
          <h2 className="font-playfair text-charcoal text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            {copy.sectionLead}
          </h2>
        </div>

        {/* Editorial grid — first piece spans 2 cols on desktop, others alternate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16 md:gap-y-24">
          {visible.map((cake, i) => (
            <CatalogTile
              key={cake.id}
              cake={cake}
              locale={locale}
              prominent={i === 0 || i === 3}
              index={i}
            />
          ))}
        </div>

        {/* Closing CTA — quiet, full-width line */}
        <div className={cn("mt-20 md:mt-28 flex", isRTL ? "justify-start" : "justify-end")}>
          <Link
            href={`${prefix}/galerie`}
            className="group inline-flex items-center gap-3 text-charcoal hover:text-rose transition-colors"
          >
            <span className="font-playfair italic text-lg md:text-xl">{copy.viewAll}</span>
            <ArrowRight
              size={20}
              className={cn(
                "transition-transform group-hover:translate-x-1",
                isRTL && "rotate-180 group-hover:-translate-x-1"
              )}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
