"use client";

import { useTranslations, useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { Search, MessageCircle, Palette, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: Search, color: "bg-sky-100 text-sky-600", number: "01" },
  { icon: MessageCircle, color: "bg-green-100 text-green-600", number: "02" },
  { icon: Palette, color: "bg-rose/10 text-rose", number: "03" },
  { icon: PartyPopper, color: "bg-gold/10 text-gold-dark", number: "04" },
];

export default function HowToOrderSection() {
  const t = useTranslations("how_to_order");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const steps = [
    { ...STEPS[0], titleKey: "step1_title", descKey: "step1_desc" },
    { ...STEPS[1], titleKey: "step2_title", descKey: "step2_desc" },
    { ...STEPS[2], titleKey: "step3_title", descKey: "step3_desc" },
    { ...STEPS[3], titleKey: "step4_title", descKey: "step4_desc" },
  ];

  return (
    <section className="section-padding bg-gradient-to-br from-[#FFF8F3] to-[#FDE8E8] relative overflow-hidden">
      {/* Decorative */}
      <div
        className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }}
        aria-hidden="true"
      />

      <div className="container-custom relative z-10">
        {/* Header */}
        <div
          ref={ref}
          className={cn(
            "flex flex-col gap-3 mb-16",
            isRTL ? "items-end text-right" : "items-center text-center",
            inView ? "animate-slide-up" : "opacity-0"
          )}
        >
          <span className="section-badge">{t("badge")}</span>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-subtitle">{t("subtitle")}</p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div
            className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px border-t-2 border-dashed border-rose/20 z-0"
            aria-hidden="true"
          />

          {steps.map(({ icon: Icon, color, number, titleKey, descKey }, i) => (
            <div
              key={number}
              className={cn(
                "relative flex flex-col gap-4 z-10 transition-all duration-700",
                isRTL ? "items-end text-right" : "items-center text-center",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Number + icon */}
              <div className="relative">
                <div
                  className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center shadow-cake",
                    color,
                    "bg-white border-2 border-border relative z-10"
                  )}
                >
                  <Icon size={28} />
                </div>
                {/* Step number */}
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose text-white text-xs font-bold flex items-center justify-center z-20 shadow">
                  {number}
                </div>
              </div>

              <div>
                <h3 className="font-playfair font-bold text-charcoal text-lg">
                  {t(titleKey as never)}
                </h3>
                <p className="text-charcoal-light text-sm mt-2 leading-relaxed max-w-[200px]">
                  {t(descKey as never)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={cn("flex mt-16", isRTL ? "justify-end" : "justify-center")}>
          <a
            href="https://wa.me/213XXXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary px-8 py-4 text-base"
          >
            <MessageCircle size={18} />
            {t("cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
