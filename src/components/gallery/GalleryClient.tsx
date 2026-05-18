"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { MessageCircle, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cake, Locale } from "@/lib/cakes-data";
import type { Category } from "@/lib/db-types";
import { CONTACT } from "@/lib/constants";

const ALL_LABEL: Record<Locale, string> = { fr: "Tous", ar: "الكل", en: "All" };

function CakeCard({ cake, locale }: { cake: Cake; locale: string }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const t = cake.translations[locale as Locale] ?? cake.translations.fr;
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const detailHref = `${prefix}/galerie/${cake.slug}`;

  const orderLabel = locale === "ar" ? "اطلب" : locale === "en" ? "Order" : "Commander";
  const greeting =
    locale === "ar"
      ? "مرحباً Gateaux Patience! أنا مهتم/ة بـ:"
      : locale === "en"
      ? "Hello Gateaux Patience! I'm interested in:"
      : "Bonjour Gateaux Patience ! Je suis intéressé(e) par :";
  const whatsappUrl = `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `${greeting} ${t.title}`
  )}`;

  return (
    <div
      ref={ref}
      className={cn(
        "cake-card group",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        "transition-all duration-500"
      )}
    >
      <div className="relative aspect-square overflow-hidden">
        <Link
          href={detailHref}
          className="block absolute inset-0 z-0"
          aria-label={t.title}
        >
          <Image
            src={cake.images[0]}
            alt={t.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Link>

        {/* Category badge */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full bg-white/90 text-rose text-xs font-medium backdrop-blur-sm shadow-sm">
            {cake.categoryLabel[locale as Locale] ?? cake.categoryLabel.fr}
          </span>
        </div>

        {/* Multi-image indicator */}
        {cake.images.length > 1 && (
          <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full pointer-events-none">
            +{cake.images.length}
          </div>
        )}

        {/* Always-visible WhatsApp order button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={orderLabel}
          aria-label={orderLabel}
          className="absolute bottom-3 right-3 z-10 flex items-center justify-center gap-1.5 w-11 h-11 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebd5c] hover:scale-105 active:scale-95 transition-all"
        >
          <MessageCircle size={16} />
          <span className="hidden md:inline text-xs font-semibold whitespace-nowrap">
            {orderLabel}
          </span>
        </a>
      </div>

      <Link href={detailHref} className="block p-4">
        <h3 className="font-playfair font-semibold text-charcoal group-hover:text-rose transition-colors line-clamp-1">
          {t.title}
        </h3>
        {cake.persons && (
          <p className="text-xs text-charcoal-light mt-1">
            {locale === "ar" ? `${cake.persons} أشخاص` : locale === "en" ? `${cake.persons} persons` : `${cake.persons} personnes`}
            {cake.pieces ? ` · ${cake.pieces} ${locale === "ar" ? "قطعة" : locale === "en" ? "portions" : "portions"}` : ""}
          </p>
        )}
      </Link>
    </div>
  );
}

export default function GalleryClient({
  cakes,
  categories,
}: {
  cakes: Cake[];
  categories: Category[];
}) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const isRTL = locale === "ar";
  const initialCategory = (() => {
    const q = searchParams.get("category");
    if (q && categories.some((c) => c.slug === q)) return q;
    return "all";
  })();
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const visible = cakes.filter((c) => c.images.length > 0);
  const filtered = activeCategory === "all" ? visible : visible.filter((c) => c.category === activeCategory);

  // Only show categories that actually have at least one visible cake (avoids
  // empty filter buttons when admin deletes the last cake of a category).
  const slugsInUse = new Set(visible.map((c) => c.category));
  const usableCategories = categories.filter((c) => slugsInUse.has(c.slug));

  return (
    <>
      {/* Page hero */}
      <div className="pt-28 pb-10 bg-gradient-to-br from-[#FFF8F3] via-[#FFF0E8] to-[#FDE8E8] border-b border-border">
        <div className="container-custom">
          <div className={cn("flex flex-col gap-2", isRTL ? "items-end text-right" : "items-start")}>
            <span className="section-badge">
              {locale === "ar" ? "معرضنا" : locale === "en" ? "Our Gallery" : "Notre Galerie"}
            </span>
            <h1 className="section-title">
              {locale === "ar" ? "إبداعاتنا" : locale === "en" ? "Our Creations" : "Nos Créations"}
            </h1>
            <p className="section-subtitle">
              {locale === "ar"
                ? "اكتشف مجموعتنا الكاملة من الكعكات المخصصة"
                : locale === "en"
                ? "Discover our complete collection of custom cakes"
                : "Découvrez notre collection complète de gâteaux personnalisés"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container-custom py-3">
          <div className={cn("flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1", isRTL && "flex-row-reverse")}>
            <SlidersHorizontal size={15} className="text-charcoal-light shrink-0" />
            <button
              key="all"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                activeCategory === "all"
                  ? "bg-rose text-white shadow-sm"
                  : "bg-surface-alt text-charcoal-light hover:text-rose hover:bg-rose/5 border border-border"
              )}
            >
              {ALL_LABEL[locale as Locale] ?? ALL_LABEL.fr}
            </button>
            {usableCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.slug)}
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  activeCategory === c.slug
                    ? "bg-rose text-white shadow-sm"
                    : "bg-surface-alt text-charcoal-light hover:text-rose hover:bg-rose/5 border border-border"
                )}
              >
                {c.labels[locale as Locale] ?? c.labels.fr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <p className={cn("text-sm text-charcoal-light mb-6", isRTL && "text-right")}>
            {filtered.length} {locale === "ar" ? "نتيجة" : locale === "en" ? "results" : "résultats"}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-charcoal-light">
              {cakes.length === 0
                ? (locale === "ar"
                    ? "لا توجد إبداعات بعد. ترقبوا قريباً!"
                    : locale === "en"
                    ? "No creations yet. Stay tuned!"
                    : "Aucune création pour l'instant. À très bientôt !")
                : (locale === "ar" ? "لا توجد نتائج" : locale === "en" ? "No results" : "Aucun résultat")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((cake) => (
                <CakeCard key={cake.id} cake={cake} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
