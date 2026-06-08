"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/constants";
import type { Cake, Locale } from "@/lib/cakes-data";

interface Props {
  cakes: Cake[];
}

// SVG of a Maghrebi 8-point-star + cross tile, used as a horizontal repeating
// border so it reads as zellige without being heavy / kitsch.
const ZELLIGE_TILE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' width='60' height='60'>
  <g fill='none' stroke='%23C9727A' stroke-width='1.2' opacity='0.7'>
    <path d='M30 4 L34 18 L48 14 L42 28 L56 30 L42 32 L48 46 L34 42 L30 56 L26 42 L12 46 L18 32 L4 30 L18 28 L12 14 L26 18 Z'/>
    <circle cx='30' cy='30' r='3' fill='%23D4AF37' stroke='none' opacity='0.6'/>
    <path d='M0 30 L8 30 M52 30 L60 30 M30 0 L30 8 M30 52 L30 60' stroke='%23D4AF37' opacity='0.5'/>
  </g>
</svg>`;

const zelligeBorderStyle = {
  backgroundImage: `url("data:image/svg+xml;utf8,${ZELLIGE_TILE.replace(/\n\s*/g, "")}")`,
  backgroundRepeat: "repeat-x",
  backgroundSize: "60px 60px",
};

function localized(locale: string, fr: string, ar: string, en: string) {
  if (locale === "ar") return ar;
  if (locale === "en") return en;
  return fr;
}

export default function ZelligeHero({ cakes }: Props) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const prefix = locale === "fr" ? "" : `/${locale}`;

  const visible = cakes.filter((c) => c.images.length > 0).slice(0, 8);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      direction: isRTL ? "rtl" : "ltr",
      align: "center",
    },
    [Autoplay({ delay: 4200, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const galleryLabel = localized(locale, "Voir la galerie", "اكتشف المعرض", "View the gallery");
  const whatsappLabel = localized(locale, "Commander sur WhatsApp", "اطلب عبر واتساب", "Order on WhatsApp");
  const cityLabel = localized(
    locale,
    "Sidi Bel Abbès · depuis 2018",
    "سيدي بلعباس · منذ 2018",
    "Sidi Bel Abbès · since 2018"
  );
  const whatsappHref = `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`;

  return (
    <section className="relative min-h-screen flex flex-col bg-gradient-to-br from-[#FFF8F3] via-[#FFF0E8] to-[#FDE8E8] overflow-hidden">
      {/* Soft glow blobs to add depth */}
      <div
        className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #C9727A, transparent)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -left-32 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }}
        aria-hidden="true"
      />

      <div className="container-custom relative z-10 w-full pt-28 md:pt-32 pb-12">
        {/* Heading block */}
        <div
          className={cn(
            "flex flex-col gap-3 mb-8 md:mb-10",
            isRTL ? "items-end text-right" : "items-center text-center"
          )}
        >
          <div className="section-badge">
            <Sparkles size={13} className="text-rose" />
            <span>{cityLabel}</span>
          </div>
          <h1 className="section-title text-4xl md:text-5xl lg:text-6xl text-balance">
            {t("title")}{" "}
            <span className="text-gradient font-playfair italic">
              {t("titleAccent")}
            </span>
          </h1>
          <p className="section-subtitle text-base md:text-lg max-w-2xl">
            {t("subtitle")}
          </p>
        </div>

        {/* Zellige-framed carousel */}
        <div className="relative max-w-5xl mx-auto">
          {/* Decorative corners */}
          <ZelligeCorner className="absolute -top-3 -left-3 md:-top-4 md:-left-4 w-12 h-12 md:w-16 md:h-16 z-30" />
          <ZelligeCorner className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-12 h-12 md:w-16 md:h-16 z-30 rotate-90" />
          <ZelligeCorner className="absolute -bottom-3 -right-3 md:-bottom-4 md:-right-4 w-12 h-12 md:w-16 md:h-16 z-30 rotate-180" />
          <ZelligeCorner className="absolute -bottom-3 -left-3 md:-bottom-4 md:-left-4 w-12 h-12 md:w-16 md:h-16 z-30 -rotate-90" />

          {/* Outer ornate frame */}
          <div className="relative rounded-[28px] p-2 md:p-3 bg-gradient-to-br from-rose/15 via-gold/10 to-rose/15 shadow-[0_30px_80px_-20px_rgba(201,114,122,0.45)]">
            {/* Inner frame — holds the zellige border strips top + bottom */}
            <div className="relative rounded-[22px] overflow-hidden bg-white">
              {/* Top zellige strip */}
              <div
                className="h-[18px] md:h-[22px] w-full"
                style={zelligeBorderStyle}
                aria-hidden="true"
              />

              {/* Carousel */}
              <div className="relative" ref={emblaRef}>
                <div className="flex">
                  {visible.map((cake) => {
                    const tr = cake.translations[locale as Locale] ?? cake.translations.fr;
                    const detailHref = `${prefix}/galerie/${cake.slug}`;
                    return (
                      <Link
                        key={cake.id}
                        href={detailHref}
                        className="relative flex-[0_0_100%] block aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9]"
                      >
                        <Image
                          src={cake.images[0]}
                          alt={tr.title}
                          fill
                          priority
                          sizes="(max-width: 1024px) 100vw, 1024px"
                          className="object-cover"
                        />
                        {/* Gradient overlay for legibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/15 to-transparent" />

                        {/* Slide caption */}
                        <div
                          className={cn(
                            "absolute bottom-0 left-0 right-0 p-5 md:p-8 flex flex-col gap-1.5",
                            isRTL ? "items-end text-right" : "items-start"
                          )}
                        >
                          <span className="px-2.5 py-1 rounded-full bg-white/95 text-rose text-[11px] font-semibold backdrop-blur-sm shadow-sm">
                            {cake.categoryLabel[locale as Locale] ?? cake.categoryLabel.fr}
                          </span>
                          <h3 className="font-playfair text-white text-xl md:text-3xl font-bold drop-shadow-lg line-clamp-2">
                            {tr.title}
                          </h3>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Bottom zellige strip */}
              <div
                className="h-[18px] md:h-[22px] w-full rotate-180"
                style={zelligeBorderStyle}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Dot indicators */}
          <div className={cn("flex justify-center items-center gap-2 mt-6", isRTL && "flex-row-reverse")}>
            {visible.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn(
                  "transition-all rounded-full",
                  i === selected
                    ? "w-8 h-2 bg-rose"
                    : "w-2 h-2 bg-rose/30 hover:bg-rose/60"
                )}
              />
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div
          className={cn(
            "flex flex-wrap gap-3 mt-8 md:mt-10",
            isRTL ? "justify-end" : "justify-center"
          )}
        >
          <Link href={`${prefix}/galerie`} className="btn-primary">
            <Sparkles size={15} />
            {galleryLabel}
            <ArrowRight size={15} className={isRTL ? "rotate-180" : ""} />
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <MessageCircle size={15} />
            {whatsappLabel}
          </a>
        </div>
      </div>

      {/* Bottom wave divider — matches the original hero */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}

function ZelligeCorner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g stroke="#C9727A" strokeWidth="1.4" fill="none">
        <path d="M2 30 L8 24 L8 8 L24 8 L30 2" />
        <path d="M14 30 L14 14 L30 14" />
        <circle cx="14" cy="14" r="3" fill="#D4AF37" stroke="none" />
      </g>
      <g stroke="#D4AF37" strokeWidth="0.8" opacity="0.6" fill="none">
        <path d="M22 22 L22 6 M6 22 L22 22" />
      </g>
    </svg>
  );
}
