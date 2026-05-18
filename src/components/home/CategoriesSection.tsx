"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import type { Category, Locale } from "@/lib/db-types";

const COPY = {
  fr: { sectionNumber: "II.", sectionTitle: "Les Spécialités", lead: "Chaque occasion mérite sa pièce." },
  ar: { sectionNumber: "II.", sectionTitle: "التخصصات", lead: "كل مناسبة تستحق قطعتها." },
  en: { sectionNumber: "II.", sectionTitle: "By Occasion", lead: "Every occasion deserves its piece." },
};

function CategoryTile({
  category,
  locale,
  index,
}: {
  category: Category;
  locale: string;
  index: number;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const label = category.labels[locale as Locale] ?? category.labels.fr;
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const isRTL = locale === "ar";

  return (
    <Link
      ref={ref}
      href={`${prefix}/galerie?category=${category.slug}`}
      className={cn(
        "group block transition-all duration-1000",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${Math.min(index * 100, 400)}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F4ECE3]">
        {category.image ? (
          <Image
            src={category.image}
            alt={label}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FDF8F2] to-[#F4ECE3]">
            <span className="font-playfair italic text-charcoal/30 text-7xl">
              {label.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-charcoal/60" />

        {/* Centered serif label on hover (always visible on mobile) */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-6 md:p-8 text-white",
            isRTL && "text-right"
          )}
        >
          <p className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-white/70 mb-2">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="font-playfair text-2xl md:text-3xl font-semibold leading-tight">
            {label}
          </h3>
        </div>
      </div>
    </Link>
  );
}

export default function CategoriesSection({ categories }: { categories: Category[] }) {
  const locale = useLocale();
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const isRTL = locale === "ar";
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  if (categories.length === 0) return null;

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div
          ref={ref}
          className={cn(
            "max-w-2xl mb-16 md:mb-20 transition-all duration-1000",
            isRTL ? "ml-auto text-right" : "",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <div className={cn("flex items-baseline gap-4 mb-5", isRTL && "flex-row-reverse")}>
            <span className="font-playfair italic text-rose text-3xl md:text-4xl">
              {copy.sectionNumber}
            </span>
            <span className="text-[10px] tracking-[0.4em] uppercase text-charcoal-lighter">
              {copy.sectionTitle}
            </span>
          </div>
          <h2 className="font-playfair text-charcoal text-3xl md:text-5xl font-bold leading-[1.1] tracking-tight">
            {copy.lead}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {categories.map((cat, i) => (
            <CategoryTile key={cat.id} category={cat} locale={locale} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
