"use client";

import { useTranslations, useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { TESTIMONIALS } from "@/lib/constants";

export default function TestimonialsSection() {
  const t = useTranslations("testimonials");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  function getTestimonialText(testimonial: (typeof TESTIMONIALS)[0]) {
    if (locale === "ar") return testimonial.text_ar;
    if (locale === "en") return testimonial.text_en;
    return testimonial.text_fr;
  }

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        {/* Header */}
        <div
          ref={ref}
          className={cn(
            "flex flex-col gap-3 mb-12",
            isRTL ? "items-end text-right" : "items-center text-center",
            inView ? "animate-slide-up" : "opacity-0"
          )}
        >
          <span className="section-badge">{t("badge")}</span>
          <h2 className="section-title">
            {t("title")}{" "}
            <span className="text-gradient font-playfair italic">
              {t("titleAccent")}
            </span>
          </h2>
          <p className="section-subtitle">{t("subtitle")}</p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, i) => (
            <div
              key={testimonial.id}
              className={cn(
                "relative p-6 rounded-2xl bg-surface-alt border border-border hover:border-rose/30 hover:shadow-cake transition-all duration-500",
                isRTL && "text-right",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Quote icon */}
              <Quote
                size={32}
                className={cn(
                  "absolute top-4 text-rose/20",
                  isRTL ? "left-4" : "right-4"
                )}
              />

              {/* Stars */}
              <div className={cn("flex gap-1 mb-3", isRTL && "justify-end")}>
                {[...Array(testimonial.rating)].map((_, j) => (
                  <Star key={j} size={14} className="text-gold fill-gold" />
                ))}
              </div>

              {/* Text */}
              <p className="text-charcoal-light text-sm leading-relaxed italic">
                &ldquo;{getTestimonialText(testimonial)}&rdquo;
              </p>

              {/* Author */}
              <div className={cn("flex items-center gap-3 mt-4 pt-4 border-t border-border", isRTL && "flex-row-reverse")}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-light to-gold-light flex items-center justify-center text-white font-bold text-sm">
                  {testimonial.name[0]}
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <div className="font-semibold text-charcoal text-sm">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-charcoal-lighter">
                    {testimonial.occasion} · {testimonial.city}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rating summary */}
        <div className={cn("flex flex-col items-center gap-2 mt-10 py-8 bg-surface-alt rounded-3xl border border-border", isRTL && "items-end")}>
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} className="text-gold fill-gold" />
            ))}
          </div>
          <div className="font-playfair text-4xl font-bold text-charcoal">5.0</div>
          <p className="text-charcoal-light text-sm">
            {locale === "ar" ? "بناءً على 100+ تقييم" : locale === "en" ? "Based on 100+ reviews" : "Basé sur 100+ avis"}
          </p>
        </div>
      </div>
    </section>
  );
}
