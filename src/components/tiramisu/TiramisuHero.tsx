"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { ArrowDown, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/constants";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function L(locale: string, fr: string, ar: string, en: string) {
  if (locale === "ar") return ar;
  if (locale === "en") return en;
  return fr;
}

function CornerBracket({
  className,
  rotate,
  delay,
}: {
  className?: string;
  rotate: string;
  delay: number;
}) {
  return (
    <span
      className={cn("inline-block pointer-events-none", className)}
      style={{ transform: rotate }}
      aria-hidden="true"
    >
      <motion.svg
        viewBox="0 0 40 40"
        fill="none"
        className="w-full h-full"
        initial={{ opacity: 0, scale: 0.55 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.7, ease: EASE }}
      >
        <path d="M4 18 L4 4 L18 4" stroke="#D4AF37" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="4" cy="4" r="1.8" fill="#D4AF37" />
      </motion.svg>
    </span>
  );
}

export default function TiramisuHero() {
  const locale = useLocale();
  const isRTL = locale === "ar";

  const badge = L(locale, "Nouveau · Atelier Tiramisu", "جديد · ورشة التيراميسو", "New · Tiramisu Workshop");
  const titleWords = L(locale, "Le tiramisu", "تيراميسو", "The tiramisu").split(" ");
  const accentWords = L(locale, "qui porte votre nom", "يحمل اسمك", "that carries your name").split(" ");
  const subtitle = L(
    locale,
    "Mascarpone onctueux, biscuits au café, nuage de cacao — et votre message écrit dessus. Composez-le, regardez-le prendre vie, et commandez en un tap.",
    "ماسكاربوني كريمي، بسكويت بالقهوة، وسحابة من الكاكاو — ورسالتك مكتوبة فوقه. صمّمه، شاهده يتحقّق، واطلبه بنقرة واحدة.",
    "Silky mascarpone, coffee-soaked biscuits, a cloud of cacao — and your message written on top. Design it, watch it come alive, and order in one tap."
  );
  const chips = [
    L(locale, "Mascarpone crémeux", "ماسكاربوني كريمي", "Creamy mascarpone"),
    L(locale, "Café & cacao véritables", "قهوة وكاكاو أصليان", "Real coffee & cacao"),
    L(locale, "Préparé le jour même", "محضّر في نفس اليوم", "Made the same day"),
  ];
  const ctaPrimary = L(locale, "Composer mon tiramisu", "صمّم تيراميسوي", "Design my tiramisu");
  const ctaWhatsapp = L(locale, "ou commander sur WhatsApp", "أو اطلب عبر واتساب", "or order on WhatsApp");
  const photoTag = L(locale, "Fait maison · le jour même", "صنع منزلي · في نفس اليوم", "Homemade · same day");

  const whatsappHref = `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`;

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="relative overflow-hidden bg-gradient-to-b from-[#FBF5EE] via-[#FAF1E8] to-[#F8E9DD] pt-24 md:pt-28"
    >
      {/* Ambient warm glows */}
      <div
        className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #E8A3A8, transparent)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -left-32 h-[480px] w-[480px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 pattern-dots opacity-25 pointer-events-none" aria-hidden="true" />

      {/* Top gold sweep */}
      <motion.div
        className="absolute top-[92px] left-0 right-0 h-px origin-left z-10"
        style={{ background: "linear-gradient(to right, transparent, #D4AF37 50%, transparent)" }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.7 }}
        transition={{ delay: 0.3, duration: 1.4, ease: EASE }}
      />

      <div className="container-custom relative z-10 pb-20 md:pb-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* ---- Photo (top on mobile, right on desktop) ---- */}
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 1.0, ease: EASE }}
            className="relative order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-none"
          >
            <div className="relative aspect-square overflow-hidden rounded-[28px] shadow-[0_45px_90px_-30px_rgba(99,40,52,0.55)] ring-1 ring-white/60">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image
                  src="/images/tiramisu/hero/hero-1.png"
                  alt={L(locale, "Tiramisu maison au cacao", "تيراميسو منزلي بالكاكاو", "Homemade cacao tiramisu")}
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 620px"
                  className="object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/35 via-transparent to-transparent pointer-events-none" />

              {/* Floating trust tag */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.8, ease: EASE }}
                className={cn(
                  "absolute bottom-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-charcoal shadow-lg backdrop-blur-sm",
                  isRTL ? "right-4" : "left-4"
                )}
              >
                <Sparkles size={14} className="text-gold" />
                {photoTag}
              </motion.div>
            </div>

            <CornerBracket delay={1.1} rotate="rotate(0deg)" className="absolute -top-2 -left-2 h-8 w-8 md:-top-3 md:-left-3 md:h-10 md:w-10" />
            <CornerBracket delay={1.15} rotate="rotate(90deg)" className="absolute -top-2 -right-2 h-8 w-8 md:-top-3 md:-right-3 md:h-10 md:w-10" />
            <CornerBracket delay={1.2} rotate="rotate(180deg)" className="absolute -bottom-2 -right-2 h-8 w-8 md:-bottom-3 md:-right-3 md:h-10 md:w-10" />
            <CornerBracket delay={1.25} rotate="rotate(-90deg)" className="absolute -bottom-2 -left-2 h-8 w-8 md:-bottom-3 md:-left-3 md:h-10 md:w-10" />
          </motion.div>

          {/* ---- Copy (bottom on mobile, left on desktop) ---- */}
          <div
            className={cn(
              "order-2 flex flex-col lg:order-1",
              isRTL ? "items-center text-center lg:items-end lg:text-right" : "items-center text-center lg:items-start lg:text-start"
            )}
          >
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full bg-white/65 px-3.5 py-1 text-[10px] uppercase tracking-[0.28em] text-charcoal-light ring-1 ring-rose/15 backdrop-blur-sm md:text-[11px]"
            >
              <motion.span
                className="h-1 w-1 rounded-full bg-gold"
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              {badge}
            </motion.span>

            <h1 className="mt-5 font-playfair text-4xl leading-[1.05] tracking-tight text-charcoal text-balance md:text-5xl lg:text-6xl">
              {titleWords.map((word, i) => (
                <motion.span
                  key={`t-${i}`}
                  initial={{ y: 26, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.08, duration: 0.8, ease: EASE }}
                  className="mr-[0.24em] inline-block last:mr-0"
                >
                  {word}
                </motion.span>
              ))}
              <br />
              {accentWords.map((word, i) => (
                <motion.span
                  key={`a-${i}`}
                  initial={{ y: 26, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + (titleWords.length + i) * 0.08, duration: 0.8, ease: EASE }}
                  className="mr-[0.2em] inline-block italic text-gradient font-medium last:mr-0"
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.6 }}
              transition={{ delay: 1.2, duration: 0.9, ease: EASE }}
              className="mt-5 h-px w-20 origin-center"
              style={{ background: "linear-gradient(to right, transparent, #D4AF37, transparent)" }}
            />

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.9, ease: EASE }}
              className="mt-4 max-w-xl text-base leading-relaxed text-charcoal-light md:text-lg"
            >
              {subtitle}
            </motion.p>

            {/* Craving chips */}
            <motion.ul
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.45, duration: 0.8, ease: EASE }}
              className={cn(
                "mt-6 flex flex-wrap gap-2.5",
                isRTL ? "justify-center lg:justify-end" : "justify-center lg:justify-start"
              )}
            >
              {chips.map((c) => (
                <li
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-medium text-charcoal ring-1 ring-rose/10"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-rose" />
                  {c}
                </li>
              ))}
            </motion.ul>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.9, ease: EASE }}
              className={cn(
                "mt-8 flex flex-col items-center gap-3",
                isRTL ? "lg:items-end" : "lg:items-start"
              )}
            >
              <a
                href="#composer"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-rose to-[#B05161] px-7 py-3.5 font-medium text-white shadow-[0_15px_40px_-12px_rgba(201,114,122,0.65)] transition-shadow hover:shadow-[0_22px_55px_-12px_rgba(201,114,122,0.85)] active:scale-[0.98]"
              >
                <span
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[1100ms] ease-out group-hover:translate-x-full"
                  aria-hidden="true"
                />
                <span className="relative">{ctaPrimary}</span>
                <motion.span
                  className="relative inline-flex"
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowDown size={16} />
                </motion.span>
              </a>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-charcoal-light transition-colors hover:text-rose"
              >
                <MessageCircle size={14} />
                <span>{ctaWhatsapp}</span>
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Wave divider into the configurator */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z"
            fill="#FFF8F3"
          />
        </svg>
      </div>
    </section>
  );
}
