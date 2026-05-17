"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  ChevronDown, Sparkles, Star, X,
  Facebook, Instagram, MessageCircle, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/constants";
import type { Locale } from "@/lib/db-types";
import type { CategoryImageGroup } from "@/lib/cakes-data";

interface Props {
  floatingGroups: CategoryImageGroup[];
}

// Six slot positions around the centre logo. Each slot is "claimed" by one
// category (if available). If there are fewer categories with cakes, the
// remaining slots stay empty.
const SLOTS = [
  { className: "absolute top-4 left-4 z-20", delay: "0s", size: "w-16 h-16 md:w-20 md:h-20" },
  { className: "absolute top-4 right-4 z-20", delay: "0.6s", size: "w-16 h-16 md:w-20 md:h-20" },
  { className: "absolute left-0 top-1/2 -translate-y-1/2 z-20", delay: "1s", size: "w-14 h-14 md:w-[72px] md:h-[72px]" },
  { className: "absolute right-0 top-1/2 -translate-y-1/2 z-20", delay: "1.4s", size: "w-14 h-14 md:w-[72px] md:h-[72px]" },
  { className: "absolute bottom-4 left-4 z-20", delay: "1.8s", size: "w-16 h-16 md:w-20 md:h-20" },
  { className: "absolute bottom-4 right-4 z-20", delay: "2.2s", size: "w-16 h-16 md:w-20 md:h-20" },
];

function CyclingImage({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    // Slight randomisation so all cards don't tick on the same beat.
    const period = 2800 + Math.floor(Math.random() * 1200);
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, period);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="relative w-full h-full">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          sizes="80px"
          className={cn(
            "object-cover absolute inset-0 transition-opacity duration-700",
            i === index ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
    </div>
  );
}

function FloatingCategoryCard({
  group,
  slot,
  locale,
}: {
  group: CategoryImageGroup;
  slot: (typeof SLOTS)[number];
  locale: string;
}) {
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const label = group.category.labels[locale as Locale] ?? group.category.labels.fr;

  return (
    <div className={slot.className}>
      <Link
        href={`${prefix}/galerie?category=${group.category.slug}`}
        className="block group"
        title={label}
      >
        <div
          className="glass rounded-2xl p-2 shadow-cake animate-float"
          style={{ animationDelay: slot.delay }}
        >
          <div className={cn("relative rounded-xl overflow-hidden bg-gray-100", slot.size)}>
            <CyclingImage images={group.images} alt={label} />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="block text-white text-[10px] font-medium text-center truncate drop-shadow">
                {label}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function LogoModal({ open, onClose, locale }: { open: boolean; onClose: () => void; locale: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const tagline =
    locale === "ar"
      ? "حلويات حرفية في سيدي بلعباس منذ 2018"
      : locale === "en"
      ? "Artisan patisserie in Sidi Bel Abbès since 2018"
      : "Pâtisserie artisanale à Sidi Bel Abbès depuis 2018";

  const followLabel =
    locale === "ar" ? "تابعونا" : locale === "en" ? "Follow us" : "Suivez-nous";

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
      label: locale === "ar" ? "اتصال" : locale === "en" ? "Call" : "Appeler",
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
          <p className="mt-1 text-sm text-charcoal-light text-center">{tagline}</p>
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

export default function HeroSection({ floatingGroups }: Props) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoOpen, setLogoOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number; y: number; size: number;
      speedX: number; speedY: number;
      opacity: number; color: string;
    }> = [];

    const colors = ["#C9727A", "#D4AF37", "#F2A8AD", "#F0D060"];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animId: number;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#FFF8F3] via-[#FFF0E8] to-[#FDE8E8]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #C9727A, transparent)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 pattern-dots opacity-40"
        aria-hidden="true"
      />

      <div className="container-custom relative z-10 w-full">
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-24 pt-32",
            isRTL && "lg:grid-cols-2"
          )}
        >
          {/* Text content */}
          <div
            className={cn(
              "flex flex-col gap-6 animate-slide-up",
              isRTL ? "text-right items-end" : "text-left items-start"
            )}
          >
            <div className="section-badge">
              <Sparkles size={13} className="text-rose" />
              <span>{t("badge")}</span>
            </div>

            <h1 className="section-title text-4xl md:text-5xl lg:text-6xl text-balance">
              {t("title")}{" "}
              <span className="text-gradient font-playfair italic">
                {t("titleAccent")}
              </span>
            </h1>

            <p className="section-subtitle text-base md:text-lg">
              {t("subtitle")}
            </p>

            <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="text-gold fill-gold" />
              ))}
              <span className="text-xs text-charcoal-light ml-2">
                100+ clients satisfaits
              </span>
            </div>

            <div className={cn("flex flex-wrap gap-3 mt-2", isRTL && "flex-row-reverse")}>
              <Link href={`${prefix}/galerie`} className="btn-primary">
                <Sparkles size={15} />
                {t("cta_primary")}
              </Link>
              <a
                href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                {t("cta_secondary")}
              </a>
            </div>

            <div
              className={cn(
                "flex items-center gap-6 mt-4 pt-6 border-t border-border",
                isRTL && "flex-row-reverse"
              )}
            >
              {[
                { value: "+100", label: locale === "ar" ? "طلبية" : locale === "en" ? "orders" : "commandes" },
                { value: "2018", label: locale === "ar" ? "منذ" : locale === "en" ? "since" : "depuis" },
                { value: "100%", label: locale === "ar" ? "حرفي" : locale === "en" ? "artisan" : "artisanal" },
              ].map((stat) => (
                <div key={stat.value} className={cn("flex flex-col", isRTL && "items-end")}>
                  <span className="font-playfair text-2xl font-bold text-rose">
                    {stat.value}
                  </span>
                  <span className="text-xs text-charcoal-light uppercase tracking-wide">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero right — clickable logo at centre, category cards floating around */}
          <div className="relative flex justify-center items-center h-[440px] md:h-[520px]">

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[340px] h-[340px] md:w-[420px] md:h-[420px] rounded-full border-2 border-dashed border-rose/20 animate-[spin_30s_linear_infinite]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[260px] h-[260px] md:w-[320px] md:h-[320px] rounded-full border border-gold/20 animate-[spin_20s_linear_infinite_reverse]" />
            </div>

            {/* Centre — clickable logo */}
            <button
              type="button"
              onClick={() => setLogoOpen(true)}
              className="relative z-10 animate-float rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-rose/30"
              aria-label="Voir nos réseaux sociaux"
            >
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full shadow-[0_20px_60px_rgba(201,114,122,0.3)] ring-4 ring-white overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]">
                <Image
                  src="/Logo/Logo-Photoroom.png"
                  alt="Gateaux Patience"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </button>

            {/* Floating category cards */}
            {floatingGroups.slice(0, SLOTS.length).map((group, i) => (
              <FloatingCategoryCard
                key={group.category.id}
                group={group}
                slot={SLOTS[i]}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-charcoal-lighter animate-bounce">
        <span className="text-xs uppercase tracking-widest">{t("scroll")}</span>
        <ChevronDown size={18} />
      </div>

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

      <LogoModal open={logoOpen} onClose={() => setLogoOpen(false)} locale={locale} />
    </section>
  );
}
