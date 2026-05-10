"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { Gem, Brush, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const ABOUT_IMAGES = [
  "/images/Cake14/FB_IMG_1778413461900.jpg",
  "/images/Cake12/FB_IMG_1778413358469.jpg",
  "/images/Cake17/FB_IMG_1778413581359.jpg",
];

export default function AboutSection() {
  const t = useTranslations("about");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const { ref: headRef, inView: headVisible } = useInView({ triggerOnce: true, threshold: 0.2 });
  const { ref: imgRef, inView: imgVisible } = useInView({ triggerOnce: true, threshold: 0.2 });

  const values = [
    { key: "quality", icon: <Gem size={18} className="text-rose" />, titleKey: "quality", descKey: "quality_desc" },
    { key: "custom", icon: <Brush size={18} className="text-gold" />, titleKey: "custom", descKey: "custom_desc" },
    { key: "passion", icon: <Heart size={18} className="text-rose fill-rose" />, titleKey: "passion", descKey: "passion_desc" },
  ];

  return (
    <section className="section-padding bg-white overflow-hidden">
      <div className="container-custom">
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-2 gap-16 items-center",
            isRTL && "lg:flex-row-reverse"
          )}
        >
          {/* Images collage */}
          <div
            ref={imgRef}
            className={cn(
              "relative transition-all duration-1000",
              imgVisible ? "opacity-100 translate-x-0" : isRTL ? "opacity-0 translate-x-12" : "opacity-0 -translate-x-12"
            )}
          >
            <div className="relative h-[420px] md:h-[500px]">
              {/* Main image */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(201,114,122,0.2)]">
                <Image
                  src={ABOUT_IMAGES[0]}
                  alt="Gateaux Patience - Notre passion"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {/* Secondary image */}
              <div className="absolute -bottom-6 -right-6 w-40 h-48 rounded-2xl overflow-hidden border-4 border-white shadow-cake z-10">
                <Image
                  src={ABOUT_IMAGES[1]}
                  alt="Création artisanale"
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>

              {/* Third image */}
              <div className="absolute -top-4 -right-4 w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-cake z-10">
                <Image
                  src={ABOUT_IMAGES[2]}
                  alt="Gâteau artisanal"
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>

              {/* Year badge */}
              <div className="absolute top-6 left-6 z-10">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-cake text-center">
                  <div className="font-playfair text-2xl font-bold text-rose">2018</div>
                  <div className="text-xs text-charcoal-light">
                    {locale === "ar" ? "منذ" : locale === "en" ? "Founded" : "Fondée"}
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative element */}
            <div
              className="absolute -z-10 -bottom-8 -left-8 w-64 h-64 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #C9727A, transparent)" }}
            />
          </div>

          {/* Text content */}
          <div
            ref={headRef}
            className={cn(
              "flex flex-col gap-6 transition-all duration-1000 delay-200",
              isRTL ? "items-end text-right" : "items-start",
              headVisible ? "opacity-100 translate-x-0" : isRTL ? "opacity-0 -translate-x-12" : "opacity-0 translate-x-12"
            )}
          >
            <span className="section-badge">{t("badge")}</span>
            <h2 className="section-title">
              {t("title")}{" "}
              <span className="text-gradient font-playfair italic">
                {t("titleAccent")}
              </span>
            </h2>

            <p className="text-charcoal-light leading-relaxed">{t("paragraph1")}</p>
            <p className="text-charcoal-light leading-relaxed">{t("paragraph2")}</p>

            {/* Values */}
            <div className="grid grid-cols-1 gap-4 w-full mt-2">
              {values.map(({ key, icon, titleKey, descKey }) => (
                <div
                  key={key}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-2xl bg-surface-alt border border-border hover:border-rose/30 transition-colors",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <div className="font-semibold text-charcoal text-sm">
                      {t(titleKey as never)}
                    </div>
                    <div className="text-xs text-charcoal-light mt-0.5">
                      {t(descKey as never)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
