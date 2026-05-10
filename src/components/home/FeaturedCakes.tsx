"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { ArrowRight, Eye, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURED_CAKES = [
  {
    id: "cake-1",
    slug: "gateau-cocomelon",
    image: "/images/Cake1/FB_IMG_1778412877519.jpg",
    category: "birthday_kids",
    featured: true,
  },
  {
    id: "cake-2",
    slug: "gateau-princesse",
    image: "/images/Cake7/FB_IMG_1778413136978.jpg",
    category: "birthday_kids",
    featured: true,
  },
  {
    id: "cake-3",
    slug: "gateau-mama",
    image: "/images/Cake3/FB_IMG_1778412989942.jpg",
    category: "birthday_adults",
    featured: true,
  },
  {
    id: "cake-4",
    slug: "gateau-creation",
    image: "/images/Cake10/FB_IMG_1778413266822.jpg",
    category: "customs",
    featured: false,
  },
  {
    id: "cake-5",
    slug: "gateau-elegant",
    image: "/images/Cake13/FB_IMG_1778413404351.jpg",
    category: "wedding",
    featured: false,
  },
  {
    id: "cake-6",
    slug: "gateau-floral",
    image: "/images/Cake18/FB_IMG_1778413600688.jpg",
    category: "birthday_adults",
    featured: false,
  },
];

function CakeCard({
  cake,
  index,
  locale,
}: {
  cake: (typeof FEATURED_CAKES)[0];
  index: number;
  locale: string;
}) {
  const t = useTranslations("featured");
  const tCat = useTranslations("categories");
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const titles: Record<string, Record<string, string>> = {
    "cake-1": { fr: "Gâteau CoComelon", en: "CoComelon Cake", ar: "كعكة كوكوميلون" },
    "cake-2": { fr: "Gâteau Princesse", en: "Princess Cake", ar: "كعكة الأميرة" },
    "cake-3": { fr: "Gâteau أمي", en: "Mom's Cake", ar: "كعكة أمي" },
    "cake-4": { fr: "Création Florale", en: "Floral Creation", ar: "إبداع زهري" },
    "cake-5": { fr: "Gâteau Élégance", en: "Elegance Cake", ar: "كعكة الأناقة" },
    "cake-6": { fr: "Gâteau Romantique", en: "Romantic Cake", ar: "كعكة رومانسية" },
  };

  const title = titles[cake.id]?.[locale] || titles[cake.id]?.fr || "Création";
  const prefix = locale === "fr" ? "" : `/${locale}`;

  return (
    <div
      ref={ref}
      className={cn(
        "cake-card group transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={cake.image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Hover actions */}
        <div className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
          <div className="flex gap-2 w-full">
            <Link
              href={`${prefix}/galerie/${cake.slug}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white text-charcoal text-xs font-medium hover:bg-rose hover:text-white transition-colors"
            >
              <Eye size={13} />
              {t("view_details")}
            </Link>
            <a
              href="https://wa.me/213XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose text-white text-xs font-medium hover:bg-rose-dark transition-colors"
            >
              <ShoppingBag size={13} />
              {t("order_this")}
            </a>
          </div>
        </div>

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-white/90 text-rose text-xs font-medium backdrop-blur-sm">
            {tCat(cake.category as keyof ReturnType<typeof tCat>)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-playfair font-semibold text-charcoal group-hover:text-rose transition-colors">
          {title}
        </h3>
        <p className="text-xs text-charcoal-light mt-1">{t("contact_for_price" as never) || "Devis sur demande"}</p>
      </div>
    </div>
  );
}

export default function FeaturedCakes() {
  const t = useTranslations("featured");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const prefix = locale === "fr" ? "" : `/${locale}`;

  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        {/* Header */}
        <div
          ref={ref}
          className={cn(
            "flex flex-col gap-3 mb-12",
            isRTL ? "items-end text-right" : "items-start",
            inView ? "animate-slide-up" : "opacity-0"
          )}
        >
          <span className="section-badge">{t("badge")}</span>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-subtitle">{t("subtitle")}</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_CAKES.map((cake, i) => (
            <CakeCard key={cake.id} cake={cake} index={i} locale={locale} />
          ))}
        </div>

        {/* View all CTA */}
        <div className={cn("flex mt-12", isRTL ? "justify-start flex-row-reverse" : "justify-center")}>
          <Link
            href={`${prefix}/galerie`}
            className={cn("btn-primary", isRTL && "flex-row-reverse")}
          >
            {t("view_all")}
            <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
          </Link>
        </div>
      </div>
    </section>
  );
}
