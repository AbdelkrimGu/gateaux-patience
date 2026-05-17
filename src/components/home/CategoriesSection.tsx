"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { ArrowRight, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category, Locale } from "@/lib/db-types";

const FALLBACK_GRADIENTS = [
  "from-rose-400 to-pink-500",
  "from-sky-400 to-violet-500",
  "from-amber-400 to-yellow-500",
  "from-purple-400 to-indigo-500",
  "from-orange-400 to-rose-400",
  "from-emerald-400 to-teal-500",
  "from-red-400 to-rose-500",
];

function CategoryCard({
  category,
  index,
  locale,
}: {
  category: Category;
  index: number;
  locale: string;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const isRTL = locale === "ar";
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const label = category.labels[locale as Locale] ?? category.labels.fr;
  const gradient = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];

  return (
    <div
      ref={ref}
      className={cn(
        "category-card rounded-2xl overflow-hidden shadow-cake hover:shadow-cake-hover transition-all duration-500",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <Link href={`${prefix}/galerie?category=${category.slug}`}>
        <div className="relative h-48 md:h-56 group">
          {category.image ? (
            <Image
              src={category.image}
              alt={label}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <Tag size={42} className="text-white/70" />
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
            <div className={cn("flex items-end justify-between gap-3", isRTL && "flex-row-reverse")}>
              <h3 className="font-playfair font-bold text-white text-lg leading-tight">
                {label}
              </h3>
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

export default function CategoriesSection({ categories }: { categories: Category[] }) {
  const t = useTranslations("categories");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  if (categories.length === 0) return null;

  return (
    <section className="section-padding bg-surface-alt">
      <div className="container-custom">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.id} category={cat} index={i} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
