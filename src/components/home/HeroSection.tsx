"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  Facebook,
  Instagram,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/constants";
import type { Cake, CategoryImageGroup, Locale } from "@/lib/cakes-data";

interface Props {
  hero: Cake[];
  floatingGroups: CategoryImageGroup[];
}

const ROTATION_MS = 6500;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Satellites sit on a true orbital ring at 60° intervals, computed with
// trigonometry. ORBIT_R is the satellite-center distance from the container
// centre, expressed as a percentage of half the container width — that lets
// the layout scale cleanly between mobile and desktop with one constant.
const SAT_COUNT = 6;
const ORBIT_R = 41; // % of container width — container is now wider so this still pushes the ring far out in absolute terms.
const SAT_DELAY_BASE = 0.95;

function slotStyle(i: number) {
  // i=0 sits at the top (12 o'clock), then clockwise every 60°.
  const angleDeg = (i * (360 / SAT_COUNT)) - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  const offX = Math.cos(angleRad) * ORBIT_R;
  const offY = Math.sin(angleRad) * ORBIT_R;
  // Use sign-aware calc so negatives stay valid CSS across all browsers.
  const xExpr = offX >= 0 ? `+ ${offX.toFixed(3)}%` : `- ${Math.abs(offX).toFixed(3)}%`;
  const yExpr = offY >= 0 ? `+ ${offY.toFixed(3)}%` : `- ${Math.abs(offY).toFixed(3)}%`;
  return {
    left: `calc(50% ${xExpr})`,
    top: `calc(50% ${yExpr})`,
    transform: "translate(-50%, -50%)",
  } as React.CSSProperties;
}

function localized(locale: string, fr: string, ar: string, en: string) {
  if (locale === "ar") return ar;
  if (locale === "en") return en;
  return fr;
}

function CyclingImage({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (images.length <= 1) return;
    const period = 2800 + Math.floor(Math.random() * 1400);
    const id = setInterval(() => setI((p) => (p + 1) % images.length), period);
    return () => clearInterval(id);
  }, [images.length]);
  return (
    <div className="relative w-full h-full">
      {images.map((src, idx) => (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          sizes="80px"
          className={cn(
            "object-cover absolute inset-0 transition-opacity duration-700",
            idx === i ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
    </div>
  );
}

function Satellite({
  group,
  index,
  locale,
  onOpen,
}: {
  group: CategoryImageGroup;
  index: number;
  locale: string;
  onOpen: () => void;
}) {
  const label =
    group.category.labels[locale as Locale] ?? group.category.labels.fr;
  const delay = SAT_DELAY_BASE + index * 0.08;

  // Outer button owns the positioning transform (translate -50% so the
  // medallion's centre — not its corner — lands on the tick). Inner motion
  // element owns the entry / hover / tap scale animations so Framer Motion
  // can't override the outer transform.
  return (
    <button
      type="button"
      onClick={onOpen}
      title={label}
      aria-label={label}
      className="absolute z-20 group focus:outline-none"
      style={slotStyle(index)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.75, ease: EASE }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="relative w-[68px] h-[68px] md:w-[118px] md:h-[118px] rounded-full overflow-hidden ring-[2.5px] ring-[#D4AF37] group-hover:ring-[#E5C158] shadow-[0_10px_26px_-8px_rgba(99,40,52,0.5)] group-hover:shadow-[0_14px_30px_-8px_rgba(201,114,122,0.55)] transition-[box-shadow] bg-rose/10"
      >
        <CyclingImage images={group.images} alt={label} />
      </motion.div>
    </button>
  );
}

function CategoryPickerModal({
  open,
  onClose,
  groups,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  groups: CategoryImageGroup[];
  locale: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const isRTL = locale === "ar";
  const prefix = locale === "fr" ? "" : `/${locale}`;

  const title = localized(
    locale,
    "Nos univers de gâteaux",
    "عوالم كعكاتنا",
    "Our cake worlds"
  );
  const subtitle = localized(
    locale,
    "Choisissez une catégorie pour explorer la galerie",
    "اختر فئة لاستكشاف المعرض",
    "Pick a category to explore the gallery"
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg md:max-w-3xl w-full overflow-hidden animate-scale-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-charcoal hover:bg-rose hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div
          className={cn(
            "px-6 pt-8 pb-4",
            isRTL ? "text-right" : "text-center md:text-left"
          )}
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.28em] uppercase text-charcoal-lighter">
            <span className="w-1 h-1 rounded-full bg-gold" />
            Gateaux Patience
          </span>
          <h2 className="mt-2 font-playfair text-2xl md:text-3xl font-bold text-charcoal">
            {title}
          </h2>
          <p className="text-sm text-charcoal-light mt-1">{subtitle}</p>
        </div>

        {/* Grid */}
        <div className="px-6 pb-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {groups.map((g) => {
              const label =
                g.category.labels[locale as Locale] ?? g.category.labels.fr;
              return (
                <Link
                  key={g.category.id}
                  href={`${prefix}/galerie?category=${g.category.slug}`}
                  onClick={onClose}
                  className="group relative aspect-square rounded-2xl overflow-hidden ring-1 ring-rose/15 shadow-cake hover:shadow-cake-hover hover:ring-rose/40 transition-all"
                >
                  {g.images[0] && (
                    <Image
                      src={g.images[0]}
                      alt={label}
                      fill
                      sizes="(max-width: 768px) 45vw, 220px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <h3 className="font-playfair text-white font-semibold text-sm md:text-base leading-tight drop-shadow-md line-clamp-2">
                      {label}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoModal({
  open,
  onClose,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  locale: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const tagline = localized(
    locale,
    "Pâtisserie artisanale à Sidi Bel Abbès depuis 2018",
    "حلويات حرفية في سيدي بلعباس منذ 2018",
    "Artisan patisserie in Sidi Bel Abbès since 2018"
  );
  const followLabel = localized(locale, "Suivez-nous", "تابعونا", "Follow us");

  const socials = [
    {
      label: "Facebook",
      href: CONTACT.facebook,
      icon: Facebook,
      bg: "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white",
    },
    {
      label: "Instagram",
      href: CONTACT.instagram,
      icon: Instagram,
      bg: "bg-gradient-to-br from-[#FEDA75]/15 via-[#FA7E1E]/15 to-[#D62976]/15 text-[#D62976] hover:from-[#FEDA75] hover:via-[#FA7E1E] hover:to-[#D62976] hover:text-white",
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`,
      icon: MessageCircle,
      bg: "bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white",
    },
    {
      label: localized(locale, "Appeler", "اتصال", "Call"),
      href: `tel:${CONTACT.phone.replace(/\s/g, "")}`,
      icon: Phone,
      bg: "bg-rose/10 text-rose hover:bg-rose hover:text-white",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-charcoal hover:bg-rose hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center pt-8 px-6">
          <div className="w-44 h-44 rounded-3xl overflow-hidden ring-4 ring-white shadow-[0_15px_40px_rgba(201,114,122,0.25)] bg-gradient-to-br from-[#FFF8F3] to-[#FDE8E8]">
            <Image
              src="/Logo/Logo-Photoroom.png"
              alt="Gateaux Patience"
              width={176}
              height={176}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <h2 className="mt-5 font-playfair text-2xl font-bold text-charcoal text-center">
            Gateaux Patience
          </h2>
          <p className="mt-1 text-sm text-charcoal-light text-center">
            {tagline}
          </p>
        </div>

        <div className="mt-6 px-6 pb-6">
          <div className="text-center mb-3">
            <span className="text-[10px] uppercase tracking-widest text-charcoal-lighter font-semibold">
              {followLabel}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-colors",
                  s.bg
                )}
                title={s.label}
              >
                <s.icon size={20} />
                <span className="text-[10px] font-medium">{s.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
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
        <path
          d="M4 18 L4 4 L18 4"
          stroke="#D4AF37"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="4" cy="4" r="1.8" fill="#D4AF37" />
        <path
          d="M11 11 L11 8 M11 11 L8 11"
          stroke="#D4AF37"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.55"
        />
      </motion.svg>
    </span>
  );
}

export default function HeroSection({ hero, floatingGroups }: Props) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const [logoOpen, setLogoOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const stories = hero.filter((c) => c.images.length > 0).slice(0, 5);
  const sats = floatingGroups.slice(0, SAT_COUNT);
  const [storyIndex, setStoryIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (stories.length <= 1) return;
    const id = setInterval(() => {
      setStoryIndex((i) => (i + 1) % stories.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [stories.length]);

  // Scroll-linked parallax — gentle, mobile-friendly
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const orbitY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const storyY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const active = stories[storyIndex];
  const activeTr = active
    ? active.translations[locale as Locale] ?? active.translations.fr
    : null;
  const activeCategoryLabel = active
    ? active.categoryLabel[locale as Locale] ?? active.categoryLabel.fr
    : "";
  const activeHref = active
    ? `${prefix}/galerie/${active.slug}`
    : `${prefix}/galerie`;

  const atelierLabel = localized(
    locale,
    "Atelier Pâtisserie · Sidi Bel Abbès",
    "ورشة الحلويات · سيدي بلعباس",
    "Pâtisserie Atelier · Sidi Bel Abbès"
  );
  const featuredLabel = localized(
    locale,
    "Pièce du moment",
    "قطعة اللحظة",
    "Featured creation"
  );
  const whatsappLabel = localized(
    locale,
    "ou écrire sur WhatsApp",
    "أو راسل عبر واتساب",
    "or message on WhatsApp"
  );
  const socialTitle = localized(
    locale,
    "Voir nos réseaux sociaux",
    "تابعونا",
    "See our social channels"
  );

  const titleWords = t("title").split(" ");
  const accentWords = t("titleAccent").split(" ");

  const whatsappHref = `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`;

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col overflow-hidden bg-gradient-to-b from-[#FBF5EE] via-[#FAF1E8] to-[#F8E9DD]"
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #E8A3A8, transparent)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -left-32 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 pattern-dots opacity-25 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top gold sweep */}
      <motion.div
        className="absolute top-[88px] md:top-[96px] left-0 right-0 h-px origin-left z-10"
        style={{
          background:
            "linear-gradient(to right, transparent, #D4AF37 50%, transparent)",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.7 }}
        transition={{ delay: 0.4, duration: 1.4, ease: EASE }}
      />

      <div className="container-custom relative z-10 pt-24 md:pt-28 pb-16 md:pb-20 flex flex-col items-center gap-10 md:gap-14">
        {/* Atelier badge */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: EASE }}
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/65 backdrop-blur-sm ring-1 ring-rose/15 text-charcoal-light text-[10px] md:text-[11px] tracking-[0.28em] uppercase">
            <motion.span
              className="w-1 h-1 rounded-full bg-gold"
              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            {atelierLabel}
          </span>
        </motion.div>

        {/* CONSTELLATION: logo at centre, 6 satellites on a true orbital ring.
            On mobile, extends into the parent's padding area so it can fill the
            screen width edge-to-edge (the parent flex container centres it
            symmetrically via items-center, so it stays balanced). */}
        <motion.div
          style={{ y: orbitY }}
          className="relative w-[calc(100%+2rem)] -mx-4 sm:w-full sm:max-w-[860px] sm:mx-auto aspect-square"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Orbital structure — gold ring + 6 radial spokes. Both draw in
                on mount so the constellation feels deliberate, not random. */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              {/* Spokes from just outside the logo to just inside the medallion */}
              <g stroke="#D4AF37" strokeWidth="0.3" strokeOpacity="0.45" strokeLinecap="round">
                {Array.from({ length: SAT_COUNT }).map((_, i) => {
                  const a = ((i * (360 / SAT_COUNT)) - 90) * Math.PI / 180;
                  const innerR = 0; // draw from the logo centre. Logo (z-10) and the white ring
                                    // sit on top of the SVG, so the inner portion is visually
                                    // clipped — but the pathLength animation still extends from
                                    // centre outward, making the spokes feel like rays emerging
                                    // from the brand mark on mount.
                  const outerR = ORBIT_R; // …all the way to the satellite centre. The medallion's
                                          // overflow-hidden clips the inner portion of the spoke
                                          // so each connector visually ends right at the medallion edge.
                  return (
                    <motion.line
                      key={i}
                      x1={50 + Math.cos(a) * innerR}
                      y1={50 + Math.sin(a) * innerR}
                      x2={50 + Math.cos(a) * outerR}
                      y2={50 + Math.sin(a) * outerR}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ delay: 0.7 + i * 0.06, duration: 0.7, ease: EASE }}
                    />
                  );
                })}
              </g>
              {/* The orbital ring — satellites land on this circle */}
              <motion.circle
                cx="50"
                cy="50"
                r={ORBIT_R}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="0.6"
                strokeOpacity="0.7"
                strokeDasharray={2 * Math.PI * ORBIT_R}
                initial={{ strokeDashoffset: 2 * Math.PI * ORBIT_R }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ delay: 0.4, duration: 1.6, ease: EASE }}
              />
              {/* Tiny gold tick at each satellite anchor point */}
              <g fill="#D4AF37" fillOpacity="0.7">
                {Array.from({ length: SAT_COUNT }).map((_, i) => {
                  const a = ((i * (360 / SAT_COUNT)) - 90) * Math.PI / 180;
                  return (
                    <motion.circle
                      key={i}
                      cx={50 + Math.cos(a) * ORBIT_R}
                      cy={50 + Math.sin(a) * ORBIT_R}
                      r="0.7"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2 + i * 0.06, duration: 0.4, ease: EASE }}
                    />
                  );
                })}
              </g>
            </svg>

            {/* Central clickable logo */}
            <motion.button
              type="button"
              onClick={() => setLogoOpen(true)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 1.0, ease: EASE }}
              className="relative z-10 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-rose/30"
              aria-label={socialTitle}
            >
              <div className="w-[230px] h-[230px] md:w-[360px] md:h-[360px] rounded-full overflow-hidden ring-4 ring-white shadow-[0_25px_55px_-15px_rgba(201,114,122,0.5)] cursor-pointer transition-transform hover:scale-[1.04]">
                <Image
                  src="/Logo/Logo-Photoroom.png"
                  alt="Gateaux Patience"
                  width={220}
                  height={220}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </motion.button>

            {/* Satellites placed mathematically around the orbital ring */}
            {sats.map((group, i) => (
              <Satellite
                key={group.category.id}
                group={group}
                index={i}
                locale={locale}
                onOpen={() => setPickerOpen(true)}
              />
            ))}
          </div>
        </motion.div>

        {/* H1 + accent — word stagger */}
        <div
          className={cn(
            "flex flex-col items-center text-center max-w-2xl",
            isRTL && "lg:items-end lg:text-right"
          )}
        >
          <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-charcoal text-balance">
            {titleWords.map((word, i) => (
              <motion.span
                key={`t-${i}`}
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 1.5 + i * 0.08,
                  duration: 0.8,
                  ease: EASE,
                }}
                className="inline-block mr-[0.24em] last:mr-0"
              >
                {word}
              </motion.span>
            ))}
            <br />
            {accentWords.map((word, i) => (
              <motion.span
                key={`a-${i}`}
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 1.5 + (titleWords.length + i) * 0.08,
                  duration: 0.8,
                  ease: EASE,
                }}
                className="inline-block mr-[0.24em] last:mr-0 italic text-gradient font-medium"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Gold hairline */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.6 }}
            transition={{ delay: 2.0, duration: 0.9, ease: EASE }}
            className="h-px w-20 origin-center mt-5 mb-4"
            style={{
              background:
                "linear-gradient(to right, transparent, #D4AF37, transparent)",
            }}
          />

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.1, duration: 0.9, ease: EASE }}
            className="text-charcoal-light text-base md:text-lg leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        {/* CINEMATIC CAKE STORIES */}
        {stories.length > 0 && (
          <motion.div
            style={{ y: storyY }}
            className="relative w-full max-w-md md:max-w-lg lg:max-w-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.2, duration: 1.1, ease: EASE }}
              className="relative aspect-[4/5] md:aspect-[3/4] rounded-[26px] overflow-hidden shadow-[0_45px_90px_-30px_rgba(99,40,52,0.55)] ring-1 ring-white/60 bg-rose/10"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {active && (
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 1.25, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0"
                  >
                    <Link
                      href={activeHref}
                      className="block w-full h-full group"
                      aria-label={activeTr?.title ?? ""}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.06] }}
                        transition={{
                          duration: ROTATION_MS / 1000,
                          ease: "linear",
                        }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={active.images[0]}
                          alt={activeTr?.title ?? ""}
                          fill
                          priority
                          sizes="(max-width: 1024px) 90vw, 620px"
                          className="object-cover"
                        />
                      </motion.div>

                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/5 to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/20 via-transparent to-transparent pointer-events-none" />

                      <div
                        className={cn(
                          "absolute bottom-5 inset-x-5 md:bottom-7 md:inset-x-7 flex flex-col gap-1",
                          isRTL && "items-end text-right"
                        )}
                      >
                        <span className="text-[9px] md:text-[10px] tracking-[0.32em] uppercase text-white/75">
                          {featuredLabel}
                        </span>
                        <h3 className="font-playfair text-white text-xl md:text-2xl lg:text-3xl font-semibold leading-tight drop-shadow-lg line-clamp-2">
                          {activeTr?.title}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 mt-1 text-white/85 text-xs md:text-sm",
                            isRTL && "flex-row-reverse"
                          )}
                        >
                          <span className="w-4 h-px bg-gold/80" />
                          {activeCategoryLabel}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Gold corner brackets */}
            <CornerBracket
              delay={2.5}
              rotate="rotate(0deg)"
              className="absolute -top-2 -left-2 md:-top-3 md:-left-3 w-7 h-7 md:w-10 md:h-10"
            />
            <CornerBracket
              delay={2.55}
              rotate="rotate(90deg)"
              className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-7 h-7 md:w-10 md:h-10"
            />
            <CornerBracket
              delay={2.6}
              rotate="rotate(180deg)"
              className="absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 w-7 h-7 md:w-10 md:h-10"
            />
            <CornerBracket
              delay={2.65}
              rotate="rotate(-90deg)"
              className="absolute -bottom-2 -left-2 md:-bottom-3 md:-left-3 w-7 h-7 md:w-10 md:h-10"
            />

            {stories.length > 1 && (
              <div
                className={cn(
                  "flex items-center justify-center gap-2 mt-6 md:mt-7",
                  isRTL && "flex-row-reverse"
                )}
              >
                {stories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStoryIndex(i)}
                    className={cn(
                      "h-[2px] rounded-full transition-all duration-500",
                      i === storyIndex
                        ? "w-10 bg-rose"
                        : "w-2.5 bg-rose/25 hover:bg-rose/55"
                    )}
                    aria-label={`Voir création ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.9, ease: EASE }}
          className="flex flex-col gap-3 items-center"
        >
          <Link
            href={`${prefix}/galerie`}
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-br from-rose to-[#B05161] text-white font-medium shadow-[0_15px_40px_-12px_rgba(201,114,122,0.65)] hover:shadow-[0_22px_55px_-12px_rgba(201,114,122,0.85)] active:scale-[0.98] transition-shadow overflow-hidden"
          >
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:translate-x-full transition-transform duration-[1100ms] ease-out"
              aria-hidden="true"
            />
            <span className="relative">{t("cta_primary")}</span>
            <motion.span
              className="relative inline-flex"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
            </motion.span>
          </Link>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-charcoal-light hover:text-rose transition-colors"
          >
            <MessageCircle size={14} />
            <span>{whatsappLabel}</span>
          </a>
        </motion.div>
      </div>

      {/* Bottom gold sweep */}
      <motion.div
        className="absolute bottom-[60px] left-0 right-0 h-px origin-right z-10"
        style={{
          background:
            "linear-gradient(to right, transparent, #D4AF37 50%, transparent)",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.45 }}
        transition={{ delay: 0.85, duration: 1.4, ease: EASE }}
      />

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z"
            fill="white"
          />
        </svg>
      </div>

      <LogoModal
        open={logoOpen}
        onClose={() => setLogoOpen(false)}
        locale={locale}
      />

      <CategoryPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        groups={floatingGroups}
        locale={locale}
      />
    </section>
  );
}
