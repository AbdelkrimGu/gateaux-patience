"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { ArrowRight, Eye, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cake, Locale } from "@/lib/cakes-data";
import { CONTACT } from "@/lib/constants";

function CakeCard({
  cake,
  index,
  locale,
}: {
  cake: Cake;
  index: number;
  locale: string;
}) {
  const t = useTranslations("featured");
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const tr = cake.translations[locale as Locale] ?? cake.translations.fr;
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const whatsappMsg = encodeURIComponent(
    `Bonjour Gateaux Patience ! Je suis intéressé(e) par : ${tr.title}`
  );

  return (
    <div
      ref={ref}
      className={cn(
        "cake-card group transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative aspect-square overflow-hidden">
        {cake.images[0] && (
          <Image
            src={cake.images[0]}
            alt={tr.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

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
              href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose text-white text-xs font-medium hover:bg-rose-dark transition-colors"
            >
              <ShoppingBag size={13} />
              {t("order_this")}
            </a>
          </div>
        </div>

        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-white/90 text-rose text-xs font-medium backdrop-blur-sm">
            {cake.categoryLabel[locale as Locale] ?? cake.categoryLabel.fr}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-playfair font-semibold text-charcoal group-hover:text-rose transition-colors">
          {tr.title}
        </h3>
        <p className="text-xs text-charcoal-light mt-1">
          {t("contact_for_price" as never) || "Devis sur demande"}
        </p>
      </div>
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
