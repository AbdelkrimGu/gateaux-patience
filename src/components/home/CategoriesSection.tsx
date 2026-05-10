"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_IMAGES: Record<string, string> = {
  "birthday-adults": "/images/Cake19/FB_IMG_1778413672901.jpg",
  "birthday-kids": "/images/Cake1/FB_IMG_1778412877519.jpg",
  wedding: "/images/Cake13/FB_IMG_1778413404351.jpg",
  graduation: "/images/Cake11/FB_IMG_1778413311320.jpg",
  daily: "/images/Cake18/FB_IMG_1778413600688.jpg",
  customs: "/images/Cake16/FB_IMG_1778413554339.jpg",
  desserts: "/images/Cake8/FB_IMG_1778413176810.jpg",
};

interface CategoryItem {
  id: string;
  labelKey: string;
  descKey: string;
  icon: string;
  gradient: string;
}

const MAIN_CATEGORIES: CategoryItem[] = [
  { id: "birthday-adults", labelKey: "birthday_adults", descKey: "birthday_adults_desc", icon: "🎂", gradient: "from-rose-400 to-pink-500" },
  { id: "birthday-kids", labelKey: "birthday_kids", descKey: "birthday_kids_desc", icon: "🎠", gradient: "from-sky-400 to-violet-500" },
  { id: "wedding", labelKey: "wedding", descKey: "wedding_desc", icon: "💍", gradient: "from-amber-400 to-yellow-500" },
  { id: "graduation", labelKey: "graduation", descKey: "graduation_desc", icon: "🎓", gradient: "from-purple-400 to-indigo-500" },
  { id: "daily", labelKey: "daily", descKey: "daily_desc", icon: "🍰", gradient: "from-orange-400 to-rose-400" },
  { id: "customs", labelKey: "customs", descKey: "customs_desc", icon: "🧁", gradient: "from-emerald-400 to-teal-500" },
  { id: "desserts", labelKey: "desserts", descKey: "desserts_desc", icon: "🍮", gradient: "from-red-400 to-rose-500" },
];

function CategoryCard({ category, index, locale }: { category: CategoryItem; index: number; locale: string }) {
  const t = useTranslations("categories");
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const isRTL = locale === "ar";
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const img = CATEGORY_IMAGES[category.id];

  return (
    <div
      ref={ref}
      className={cn(
        "category-card rounded-2xl overflow-hidden shadow-cake hover:shadow-cake-hover transition-all duration-500",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <Link href={`${prefix}/galerie?category=${category.id}`}>
        <div className="relative h-48 md:h-56">
          {img ? (
            <Image
              src={img}
              alt={t(category.labelKey as never)}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${category.gradient} flex items-center justify-center text-5xl`}>
              {category.icon}
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />

          {/* Content */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 p-4",
              isRTL && "text-right"
            )}
          >
            <div className={cn("flex items-end justify-between", isRTL && "flex-row-reverse")}>
              <div>
                <div className="text-2xl mb-1">{category.icon}</div>
                <h3 className="font-playfair font-bold text-white text-lg leading-tight">
                  {t(category.labelKey as never)}
                </h3>
                <p className="text-white/80 text-xs mt-0.5">
                  {t(category.descKey as never)}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 border border-white/30 hover:bg-rose transition-colors">
                <ArrowRight size={14} className={cn("text-white", isRTL && "rotate-180")} />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function CategoriesSection() {
  const t = useTranslations("categories");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="section-padding bg-surface-alt">
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
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-subtitle">{t("subtitle")}</p>
        </div>

        {/* Categories grid — responsive masonry-like */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {MAIN_CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.id} category={cat} index={i} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
