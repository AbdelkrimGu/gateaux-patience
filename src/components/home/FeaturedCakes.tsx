"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { MessageCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cake, Locale } from "@/lib/cakes-data";
import { CONTACT } from "@/lib/constants";

const COPY = {
  fr: {
    eyebrow: "Nos Créations",
    title: "Faites avec amour",
    blurb: "Une sélection délicate, choisie parmi nos pièces les plus aimées.",
    order: "Commander",
    viewAll: "Toutes nos créations",
    greeting: "Bonjour Gateaux Patience ! Je suis intéressé(e) par :",
  },
  ar: {
    eyebrow: "إبداعاتنا",
    title: "صُنعت بحب",
    blurb: "مجموعة رقيقة، مختارة من قطعنا الأكثر محبة.",
    order: "اطلب",
    viewAll: "كل إبداعاتنا",
    greeting: "مرحباً Gateaux Patience! أنا مهتم/ة بـ:",
  },
  en: {
    eyebrow: "Our Creations",
    title: "Made with love",
    blurb: "A delicate selection, chosen from our most loved pieces.",
    order: "Order",
    viewAll: "All our creations",
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
        "group transition-all duration-[900ms] ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-rose-200/40 hover:shadow-2xl hover:shadow-rose-300/50 transition-shadow">
        <div className="relative aspect-[4/5] overflow-hidden">
          <Link
            href={detailHref}
            className="block absolute inset-0"
            aria-label={tr.title}
          >
            <Image
              src={cake.images[0]}
              alt={tr.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
            />
          </Link>

          {/* Ribbon-style category label */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <span className="inline-block bg-white/95 backdrop-blur-sm text-rose font-playfair italic text-xs px-3 py-1 rounded-full shadow-sm">
              {cake.categoryLabel[locale as Locale] ?? cake.categoryLabel.fr}
            </span>
          </div>

          {/* Little heart top-right — pure romance */}
          <div className="absolute top-4 right-4 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Heart size={18} className="text-rose fill-rose drop-shadow" />
          </div>

          {/* Order button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={copy.order}
            aria-label={copy.order}
            className="absolute bottom-4 right-4 z-10 flex items-center justify-center gap-1.5 w-12 h-12 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebd5c] hover:scale-105 active:scale-95 transition-all"
          >
            <MessageCircle size={16} />
            <span className="hidden md:inline text-xs font-medium whitespace-nowrap">
              {copy.order}
            </span>
          </a>
        </div>

        <Link href={detailHref} className="block text-center px-5 py-6">
          <h3 className="font-playfair italic text-charcoal text-2xl leading-tight group-hover:text-rose transition-colors">
            {tr.title}
          </h3>
          <div className="my-3 flex items-center justify-center gap-3 text-gold">
            <div className="h-px w-6 bg-gold/40" />
            <span className="text-rose text-sm">❦</span>
            <div className="h-px w-6 bg-gold/40" />
          </div>
          {(cake.persons || cake.pieces) && (
            <p className="text-xs text-charcoal-light tracking-wide">
              {cake.persons ? (locale === "ar" ? `${cake.persons} أشخاص` : locale === "en" ? `${cake.persons} pers.` : `${cake.persons} pers.`) : ""}
              {cake.persons && cake.pieces ? " · " : ""}
              {cake.pieces ? `${cake.pieces} ${locale === "ar" ? "حصة" : "portions"}` : ""}
            </p>
          )}
        </Link>
      </div>
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
    <section className="py-24 md:py-32 bg-gradient-to-b from-[#FFF6F0] to-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div
          ref={ref}
          className={cn(
            "text-center max-w-2xl mx-auto mb-16 transition-all duration-1000",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <p className="font-playfair italic text-rose text-sm mb-3">{copy.eyebrow}</p>
          <h2 className="font-playfair text-charcoal text-4xl md:text-5xl font-bold leading-tight mb-4">
            {copy.title}
          </h2>
          <div className="flex items-center justify-center gap-3 text-gold mb-4">
            <div className="h-px w-12 bg-gold/40" />
            <span className="text-rose text-lg">❦</span>
            <div className="h-px w-12 bg-gold/40" />
          </div>
          <p className="text-charcoal-light text-base md:text-lg">{copy.blurb}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {visible.map((cake, i) => (
            <Card key={cake.id} cake={cake} locale={locale} index={i} />
          ))}
        </div>

        <div className={cn("mt-16 flex", isRTL ? "justify-start" : "justify-center")}>
          <Link
            href={`${prefix}/galerie`}
            className="group inline-flex items-center gap-3 bg-white border-2 border-rose text-rose px-8 py-3.5 rounded-full hover:bg-rose hover:text-white transition-all shadow-md"
          >
            <span className="font-playfair italic">{copy.viewAll}</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
