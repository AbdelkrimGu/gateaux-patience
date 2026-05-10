"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ChevronDown, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HeroSection() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
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
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Decorative circles */}
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

      {/* Dot pattern overlay */}
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
            {/* Badge */}
            <div className="section-badge">
              <Sparkles size={13} className="text-rose" />
              <span>{t("badge")}</span>
            </div>

            {/* Heading */}
            <h1 className="section-title text-4xl md:text-5xl lg:text-6xl text-balance">
              {t("title")}{" "}
              <span className="text-gradient font-playfair italic">
                {t("titleAccent")}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="section-subtitle text-base md:text-lg">
              {t("subtitle")}
            </p>

            {/* Stars */}
            <div
              className={cn(
                "flex items-center gap-1",
                isRTL && "flex-row-reverse"
              )}
            >
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className="text-gold fill-gold"
                />
              ))}
              <span className="text-xs text-charcoal-light ml-2">
                100+ clients satisfaits
              </span>
            </div>

            {/* CTAs */}
            <div
              className={cn(
                "flex flex-wrap gap-3 mt-2",
                isRTL && "flex-row-reverse"
              )}
            >
              <Link href={`${prefix}/galerie`} className="btn-primary">
                <Sparkles size={15} />
                {t("cta_primary")}
              </Link>
              <a
                href="https://wa.me/213XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                {t("cta_secondary")}
              </a>
            </div>

            {/* Trust badges */}
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

          {/* Hero right — Logo centered, cakes floating around */}
          <div className="relative flex justify-center items-center h-[440px] md:h-[520px]">

            {/* Spinning decorative rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[340px] h-[340px] md:w-[420px] md:h-[420px] rounded-full border-2 border-dashed border-rose/20 animate-[spin_30s_linear_infinite]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[260px] h-[260px] md:w-[320px] md:h-[320px] rounded-full border border-gold/20 animate-[spin_20s_linear_infinite_reverse]" />
            </div>

            {/* Center — Logo */}
            <div className="relative z-10 animate-float">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full shadow-[0_20px_60px_rgba(201,114,122,0.3)] ring-4 ring-white overflow-hidden">
                <Image
                  src="/Logo/Logo-Photoroom.png"
                  alt="Gateaux Patience"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>

            {/* Floating cake cards — positioned around the logo */}

            {/* Top left */}
            <div className="absolute top-4 left-4 z-20">
              <div className="glass rounded-2xl p-2 shadow-cake animate-float" style={{ animationDelay: "0s" }}>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden">
                  <Image src="/images/Cake1/FB_IMG_1778412877519.jpg" alt="Création" width={80} height={80} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Top right */}
            <div className="absolute top-4 right-4 z-20">
              <div className="glass rounded-2xl p-2 shadow-cake animate-float" style={{ animationDelay: "0.6s" }}>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden">
                  <Image src="/images/Cake7/FB_IMG_1778413136978.jpg" alt="Création" width={80} height={80} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Middle left */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20">
              <div className="glass rounded-2xl p-2 shadow-cake animate-float" style={{ animationDelay: "1s" }}>
                <div className="w-14 h-14 md:w-18 md:h-18 rounded-xl overflow-hidden">
                  <Image src="/images/Cake3/FB_IMG_1778412989942.jpg" alt="Création" width={72} height={72} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Middle right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
              <div className="glass rounded-2xl p-2 shadow-cake animate-float" style={{ animationDelay: "1.4s" }}>
                <div className="w-14 h-14 md:w-18 md:h-18 rounded-xl overflow-hidden">
                  <Image src="/images/Cake13/FB_IMG_1778413404351.jpg" alt="Création" width={72} height={72} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Bottom left */}
            <div className="absolute bottom-4 left-4 z-20">
              <div className="glass rounded-2xl p-2 shadow-cake animate-float" style={{ animationDelay: "1.8s" }}>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden">
                  <Image src="/images/Cake10/FB_IMG_1778413266822.jpg" alt="Création" width={80} height={80} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Bottom right */}
            <div className="absolute bottom-4 right-4 z-20">
              <div className="glass rounded-2xl p-2 shadow-cake animate-float" style={{ animationDelay: "2.2s" }}>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden">
                  <Image src="/images/Cake15/FB_IMG_1778413532329.jpg" alt="Création" width={80} height={80} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-charcoal-lighter animate-bounce">
        <span className="text-xs uppercase tracking-widest">{t("scroll")}</span>
        <ChevronDown size={18} />
      </div>

      {/* Wave divider */}
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
