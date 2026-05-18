"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import type { Category, Locale } from "@/lib/db-types";

const COPY = {
  fr: {
    eyebrow: "Pour chaque occasion",
    title: "Une création unique",
    blurb: "Mariage, anniversaire, baptême, ou tout simplement parce que. Trouvez votre inspiration.",
  },
  ar: {
    eyebrow: "لكل مناسبة",
    title: "إبداع فريد",
    blurb: "زفاف، عيد ميلاد، عماد، أو ببساطة لأنك تريد. اعثر على إلهامك.",
  },
  en: {
    eyebrow: "For every occasion",
    title: "A unique creation",
    blurb: "Wedding, birthday, baptism, or simply because. Find your inspiration.",
  },
};

const FALLBACK_TINTS = [
  "from-rose-100 to-rose-200",
  "from-amber-100 to-rose-100",
  "from-pink-100 to-rose-200",
  "from-orange-100 to-rose-100",
  "from-purple-100 to-pink-100",
  "from-blue-100 to-rose-100",
  "from-emerald-100 to-rose-100",
];

function CategoryCard({
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
  const tint = FALLBACK_TINTS[index % FALLBACK_TINTS.length];

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
      <div className="bg-white rounded-[2rem] overflow-hidden shadow-lg shadow-rose-200/40 hover:shadow-2xl hover:shadow-rose-300/50 hover:-translate-y-1 transition-all duration-500">
        <div className="relative aspect-[4/3] overflow-hidden">
          {category.image ? (
            <Image
              src={category.image}
              alt={label}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-[1200ms] group-hover:scale-110"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${tint} flex items-center justify-center`}>
              <span className="font-playfair italic text-rose/40 text-7xl">❦</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-rose-900/30 via-transparent to-transparent" />
        </div>

        <div className="text-center px-5 py-6">
          <h3 className="font-playfair italic text-charcoal text-2xl leading-tight group-hover:text-rose transition-colors">
            {label}
          </h3>
          <div className="mt-3 flex items-center justify-center gap-3 text-gold/60">
            <div className="h-px w-6 bg-gold/40" />
            <span className="text-rose text-xs">✿</span>
            <div className="h-px w-6 bg-gold/40" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CategoriesSection({ categories }: { categories: Category[] }) {
  const locale = useLocale();
  const copy = COPY[locale as Locale] ?? COPY.fr;
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  if (categories.length === 0) return null;

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-white via-[#FFF6F0] to-[#FFE8E8]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div
          ref={ref}
          className={cn(
            "text-center max-w-2xl mx-auto mb-16 transition-all duration-1000",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <p className="font-playfair italic text-rose text-sm mb-3">{copy.eyebrow}</p>
          <h2 className="font-playfair text-charcoal text-4xl md:text-5xl font-bold leading-tight mb-4">
            {copy.title}
          </h2>
          <div className="flex items-center justify-center gap-3 text-gold mb-4">
            <div className="h-px w-12 bg-gold/40" />
            <span className="text-rose text-lg">❦</span>
            <div className="h-px w-12 bg-gold/40" />
          </div>
          <p className="text-charcoal-light text-base md:text-lg">{copy.blurb}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.id} category={cat} locale={locale} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
