"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { ArrowRight, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cake, Locale } from "@/lib/cakes-data";
import { CONTACT } from "@/lib/constants";

function localized(locale: string, fr: string, ar: string, en: string): string {
  if (locale === "ar") return ar;
  if (locale === "en") return en;
  return fr;
}

function CakeCard({
  cake,
  index,
  locale,
}: {
  cake: Cake;
  index: number;
  locale: string;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const tr = cake.translations[locale as Locale] ?? cake.translations.fr;
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const detailHref = `${prefix}/galerie/${cake.slug}`;

  const orderLabel = localized(locale, "Commander", "اطلب", "Order");
  const priceLabel = localized(
    locale,
    "Devis sur demande",
    "السعر عند الطلب",
    "Price on request"
  );
  const greeting = localized(
    locale,
    "Bonjour Gateaux Patience ! Je suis intéressé(e) par :",
    "مرحباً Gateaux Patience! أنا مهتم/ة بـ:",
    "Hello Gateaux Patience! I'm interested in:"
  );
  const whatsappUrl = `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `${greeting} ${tr.title}`
  )}`;

  return (
    <div
      ref={ref}
      className={cn(
        "cake-card group transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Image area — image and category badge are inside the link to the
          detail page. The WhatsApp button is a sibling, anchored to the
          bottom-right corner, kept visible at all times. */}
      <div className="relative aspect-square overflow-hidden">
        <Link
          href={detailHref}
          className="block absolute inset-0 z-0"
          aria-label={tr.title}
        >
          {cake.images[0] && (
            <Image
              src={cake.images[0]}
              alt={tr.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
        </Link>

        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full bg-white/90 text-rose text-xs font-medium backdrop-blur-sm shadow-sm">
            {cake.categoryLabel[locale as Locale] ?? cake.categoryLabel.fr}
          </span>
        </div>

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

      {/* Title block — also a link to the detail page */}
      <Link href={detailHref} className="block p-4">
        <h3 className="font-playfair font-semibold text-charcoal group-hover:text-rose transition-colors line-clamp-1">
          {tr.title}
        </h3>
        <p className="text-xs text-charcoal-light mt-1">{priceLabel}</p>
      </Link>
    </div>
  );
}

export default function FeaturedCakes({ cakes }: { cakes: Cake[] }) {
  const t = useTranslations("featured");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const visible = cakes.filter((c) => c.images.length > 0);

  if (visible.length === 0) return null;

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((cake, i) => (
            <CakeCard key={cake.id} cake={cake} index={i} locale={locale} />
          ))}
        </div>

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
