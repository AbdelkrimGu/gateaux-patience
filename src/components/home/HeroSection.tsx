"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import type { Cake, Locale } from "@/lib/cakes-data";

interface Props {
  cakes: Cake[];
}

const COPY = {
  fr: {
    welcome: "Bienvenue chez",
    tagline: "Pâtisserie d'auteur",
    blurb: "Chaque pièce est façonnée à la main, avec amour et patience, pour rendre vos moments uniques.",
    cta: "Découvrir nos créations",
    scroll: "défiler",
  },
  ar: {
    welcome: "أهلاً بكم في",
    tagline: "حلويات المؤلف",
    blurb: "كل قطعة مصنوعة يدوياً، بحب وصبر، لجعل لحظاتكم استثنائية.",
    cta: "اكتشفوا إبداعاتنا",
    scroll: "تمرير",
  },
  en: {
    welcome: "Welcome to",
    tagline: "Signature patisserie",
    blurb: "Every piece is handmade, with love and patience, to make your moments unique.",
    cta: "Discover our creations",
    scroll: "scroll",
  },
};

// Hand-placed positions for the scattered framed photographs on desktop.
// Each frame gets a slight rotation and a different size for a "souvenir
// wall" / "wedding album spread" feel.
const FRAMES = [
  { pos: "top-[6%] left-[4%] rotate-[-9deg]",  size: "w-44 h-56 lg:w-52 lg:h-64",  delay: 0    },
  { pos: "top-[10%] right-[5%] rotate-[6deg]", size: "w-40 h-52 lg:w-48 lg:h-60",  delay: 200  },
  { pos: "bottom-[8%] left-[7%] rotate-[-5deg]", size: "w-44 h-56 lg:w-52 lg:h-64", delay: 400 },
  { pos: "bottom-[12%] right-[6%] rotate-[8deg]", size: "w-40 h-52 lg:w-48 lg:h-60", delay: 600 },
  { pos: "top-[42%] left-[2%] rotate-[4deg]",  size: "w-32 h-40 lg:w-40 lg:h-48",  delay: 800  },
  { pos: "top-[44%] right-[2%] rotate-[-7deg]", size: "w-32 h-40 lg:w-40 lg:h-48", delay: 1000 },
];

export default function HeroSection({ cakes }: Props) {
  const locale = useLocale();
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const isRTL = locale === "ar";
  const visible = cakes.filter((c) => c.images.length > 0).slice(0, 6);

  // Mobile: pick a hero cake and rotate the centre image.
  const [mobileIndex, setMobileIndex] = useState(0);
  useEffect(() => {
    if (visible.length <= 1) return;
    const id = setInterval(() => {
      setMobileIndex((i) => (i + 1) % visible.length);
    }, 5000);
    return () => clearInterval(id);
  }, [visible.length]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FFF6F0] via-[#FBE7E5] to-[#FCEAEA]">
      {/* Watercolor blobs */}
      <div
        className="absolute -top-40 -left-40 w-[420px] h-[420px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(201,114,122,0.35), transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.30), transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(242,168,173,0.40), transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Scattered polaroid frames — desktop only (visual clutter on mobile) */}
      {visible.map((cake, i) => {
        const slot = FRAMES[i % FRAMES.length];
        return (
          <Link
            key={cake.id}
            href={`${prefix}/galerie/${cake.slug}`}
            className={cn(
              "absolute hidden md:block z-10 group transition-transform duration-500 hover:!rotate-0 hover:scale-105 animate-fade-in",
              slot.pos
            )}
            style={{ animationDelay: `${slot.delay}ms`, animationFillMode: "both" }}
            title={cake.translations[locale as Locale]?.title || cake.translations.fr.title}
          >
            <div className={cn("bg-white pt-2 px-2 pb-8 shadow-xl shadow-rose-200/60", slot.size)}>
              <div className="relative w-full h-full bg-[#FFF8F3]">
                <Image
                  src={cake.images[0]}
                  alt=""
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
              <p className="absolute bottom-2 left-2 right-2 text-center font-playfair italic text-[10px] text-charcoal-light truncate">
                {cake.translations[locale as Locale]?.title || cake.translations.fr.title}
              </p>
            </div>
          </Link>
        );
      })}

      {/* Mobile: single floating polaroid above the text */}
      {visible.length > 0 && (
        <div className="md:hidden absolute top-24 left-1/2 -translate-x-1/2 z-10 w-40 h-52">
          <div className="relative w-full h-full bg-white pt-2 px-2 pb-7 shadow-xl shadow-rose-200/60 -rotate-3">
            <div className="relative w-full h-full bg-[#FFF8F3]">
              {visible.map((cake, i) => (
                <Image
                  key={cake.id}
                  src={cake.images[0]}
                  alt=""
                  fill
                  sizes="160px"
                  className={cn(
                    "object-cover absolute inset-0 transition-opacity duration-1000",
                    i === mobileIndex ? "opacity-100" : "opacity-0"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Centre content */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6 pt-48 md:pt-32 pb-20">
        <p
          className="font-playfair italic text-rose text-base md:text-lg mb-3 opacity-0 animate-fade-in"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          {copy.welcome}
        </p>
        <h1
          className="font-playfair text-charcoal text-[42px] md:text-7xl lg:text-[88px] font-bold leading-[1.05] tracking-tight mb-4 opacity-0 animate-fade-in"
          style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
          dir={isRTL ? "rtl" : "ltr"}
        >
          Gateaux <span className="italic text-rose">Patience</span>
        </h1>
        <p
          className="font-playfair italic text-charcoal-light text-lg md:text-2xl mb-8 opacity-0 animate-fade-in"
          style={{ animationDelay: "550ms", animationFillMode: "forwards" }}
        >
          — {copy.tagline} —
        </p>

        {/* Floral divider */}
        <div
          className="flex items-center gap-4 text-gold mb-8 opacity-0 animate-fade-in"
          style={{ animationDelay: "700ms", animationFillMode: "forwards" }}
        >
          <div className="h-px w-12 md:w-16 bg-gold/40" />
          <span className="text-xl md:text-2xl text-rose">❦</span>
          <div className="h-px w-12 md:w-16 bg-gold/40" />
        </div>

        <p
          className="text-charcoal max-w-md mx-auto text-base md:text-lg leading-relaxed mb-10 opacity-0 animate-fade-in"
          style={{ animationDelay: "850ms", animationFillMode: "forwards" }}
        >
          {copy.blurb}
        </p>

        <Link
          href={`${prefix}/galerie`}
          className="group inline-flex items-center gap-3 bg-rose text-white px-8 py-4 rounded-full shadow-lg shadow-rose-200/50 hover:bg-charcoal hover:shadow-xl transition-all opacity-0 animate-fade-in"
          style={{ animationDelay: "1000ms", animationFillMode: "forwards" }}
        >
          <span className="font-playfair italic text-base">{copy.cta}</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-charcoal-light/60">
        <span className="text-[10px] tracking-[0.3em] uppercase font-playfair italic">{copy.scroll}</span>
        <span className="animate-bounce text-rose">↓</span>
      </div>
    </section>
  );
}
