"use client";

import { useTranslations, useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

export default function StatsBar() {
  const t = useTranslations("stats");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const stats = [
    {
      value: <CountUp target={2018} />,
      label: t("since"),
      desc: t("year"),
      icon: "✨",
    },
    {
      value: <><CountUp target={100} suffix="+" /></>,
      label: t("cakes"),
      desc: t("cakes_label"),
      icon: "🎂",
    },
    {
      value: <CountUp target={100} suffix="%" />,
      label: t("artisanal"),
      desc: t("artisanal_label"),
      icon: "👑",
    },
    {
      value: null,
      label: t("city"),
      desc: t("city_label"),
      icon: "📍",
      isText: true,
    },
  ];

  return (
    <section className="bg-white py-12 border-y border-border/50 relative z-10">
      <div className="container-custom">
        <div
          className={cn(
            "grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4",
            isRTL && "text-right"
          )}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center text-center p-4 rounded-2xl hover:bg-surface-alt transition-colors duration-300",
                isRTL && "items-end text-right"
              )}
            >
              <span className="text-3xl mb-2">{stat.icon}</span>
              <div className="font-playfair text-2xl md:text-3xl font-bold text-rose">
                {stat.isText ? (
                  <span className="text-lg md:text-xl">{stat.label}</span>
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-xs md:text-sm text-charcoal-light mt-1 font-medium">
                {stat.isText ? stat.desc : stat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
