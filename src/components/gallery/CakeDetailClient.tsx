"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Ruler,
  Users,
  PieChart,
  MessageCircle,
  Phone,
  Share2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Cake, type Locale, getSimilarCakes } from "@/lib/cakes-data";
import { CONTACT } from "@/lib/constants";

export default function CakeDetailClient({ cake }: { cake: Cake }) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const t = cake.translations[locale as Locale] ?? cake.translations.fr;
  const similar = getSimilarCakes(cake);

  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);

  const whatsappMsg = encodeURIComponent(
    `${locale === "ar" ? "مرحباً Gateaux Patience! أنا مهتم/ة بـ" : locale === "en" ? "Hello Gateaux Patience! I'm interested in:" : "Bonjour Gateaux Patience ! Je suis intéressé(e) par :"} ${t.title}`
  );

  function prevImage() {
    setActiveImage((i) => (i === 0 ? cake.images.length - 1 : i - 1));
  }

  function nextImage() {
    setActiveImage((i) => (i === cake.images.length - 1 ? 0 : i + 1));
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const labels = {
    back: { fr: "Retour à la galerie", ar: "العودة للمعرض", en: "Back to gallery" },
    category: { fr: "Catégorie", ar: "الفئة", en: "Category" },
    dimensions: { fr: "Dimensions", ar: "الأبعاد", en: "Dimensions" },
    length: { fr: "L", ar: "ط", en: "L" },
    width: { fr: "l", ar: "ع", en: "W" },
    height: { fr: "H", ar: "ا", en: "H" },
    pieces: { fr: "Portions", ar: "القطع", en: "Portions" },
    persons: { fr: "Personnes", ar: "أشخاص", en: "Persons" },
    order: { fr: "Commander ce gâteau", ar: "اطلب هذه الكعكة", en: "Order this cake" },
    call: { fr: "Appeler", ar: "اتصل", en: "Call" },
    price: { fr: "Prix sur devis", ar: "السعر عند الطلب", en: "Price on request" },
    share: { fr: "Partager", ar: "مشاركة", en: "Share" },
    copied: { fr: "Copié !", ar: "تم النسخ!", en: "Copied!" },
    similar: { fr: "Créations Similaires", ar: "إبداعات مشابهة", en: "Similar Creations" },
    view: { fr: "Voir", ar: "عرض", en: "View" },
  };

  function lbl(key: keyof typeof labels) {
    return labels[key][locale as Locale] ?? labels[key].fr;
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="pt-24 pb-4 bg-surface-alt border-b border-border">
        <div className="container-custom">
          <Link
            href={`${prefix}/galerie`}
            className={cn(
              "inline-flex items-center gap-2 text-sm text-charcoal-light hover:text-rose transition-colors",
              isRTL && "flex-row-reverse"
            )}
          >
            {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            {lbl("back")}
          </Link>
        </div>
      </div>

      {/* Main content */}
      <section className="py-10 bg-white">
        <div className="container-custom">
          <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-12", isRTL && "lg:flex-row-reverse")}>

            {/* Image gallery */}
            <div className="flex flex-col gap-4">
              {/* Main image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-alt shadow-cake">
                <Image
                  src={cake.images[activeImage]}
                  alt={t.title}
                  fill
                  className="object-cover transition-opacity duration-300"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />

                {/* Nav arrows */}
                {cake.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center hover:bg-white transition-colors z-10"
                    >
                      <ChevronLeft size={18} className="text-charcoal" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center hover:bg-white transition-colors z-10"
                    >
                      <ChevronRight size={18} className="text-charcoal" />
                    </button>
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {cake.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImage(i)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            i === activeImage ? "bg-white w-4" : "bg-white/50"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {cake.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {cake.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                        i === activeImage ? "border-rose shadow-sm" : "border-transparent hover:border-rose/40"
                      )}
                    >
                      <Image src={img} alt={`${t.title} ${i + 1}`} fill className="object-cover" sizes="80px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className={cn("flex flex-col gap-6", isRTL && "items-end text-right")}>

              {/* Category + share */}
              <div className={cn("flex items-center justify-between w-full", isRTL && "flex-row-reverse")}>
                <span className="px-3 py-1 rounded-full bg-rose/10 text-rose text-sm font-medium border border-rose/20">
                  {cake.categoryLabel[locale as Locale] ?? cake.categoryLabel.fr}
                </span>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-sm text-charcoal-light hover:text-rose transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
                  {copied ? lbl("copied") : lbl("share")}
                </button>
              </div>

              {/* Title */}
              <h1 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal leading-tight">
                {t.title}
              </h1>

              {/* Price tag */}
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <span className="text-charcoal-lighter text-sm line-through">—</span>
                <span className="px-4 py-1.5 rounded-full bg-gold/10 text-gold-dark text-sm font-semibold border border-gold/20">
                  {lbl("price")}
                </span>
              </div>

              {/* Description */}
              <p className="text-charcoal-light leading-relaxed text-base">{t.description}</p>

              {/* Specs */}
              {(cake.length || cake.pieces || cake.persons) && (
                <div className="grid grid-cols-2 gap-3 w-full">
                  {(cake.length || cake.width || cake.height) && (
                    <div className={cn("flex items-start gap-3 p-4 rounded-2xl bg-surface-alt border border-border", isRTL && "flex-row-reverse")}>
                      <Ruler size={18} className="text-rose shrink-0 mt-0.5" />
                      <div className={isRTL ? "text-right" : ""}>
                        <div className="text-xs text-charcoal-lighter font-medium uppercase tracking-wide mb-1">
                          {lbl("dimensions")}
                        </div>
                        <div className="text-sm font-semibold text-charcoal">
                          {[
                            cake.length && `${lbl("length")} ${cake.length}`,
                            cake.width && `${lbl("width")} ${cake.width}`,
                            cake.height && `${lbl("height")} ${cake.height}`,
                          ]
                            .filter(Boolean)
                            .join(" × ")} cm
                        </div>
                      </div>
                    </div>
                  )}
                  {cake.pieces && (
                    <div className={cn("flex items-start gap-3 p-4 rounded-2xl bg-surface-alt border border-border", isRTL && "flex-row-reverse")}>
                      <PieChart size={18} className="text-gold shrink-0 mt-0.5" />
                      <div className={isRTL ? "text-right" : ""}>
                        <div className="text-xs text-charcoal-lighter font-medium uppercase tracking-wide mb-1">
                          {lbl("pieces")}
                        </div>
                        <div className="text-sm font-semibold text-charcoal">{cake.pieces}</div>
                      </div>
                    </div>
                  )}
                  {cake.persons && (
                    <div className={cn("flex items-start gap-3 p-4 rounded-2xl bg-surface-alt border border-border", isRTL && "flex-row-reverse")}>
                      <Users size={18} className="text-rose shrink-0 mt-0.5" />
                      <div className={isRTL ? "text-right" : ""}>
                        <div className="text-xs text-charcoal-lighter font-medium uppercase tracking-wide mb-1">
                          {lbl("persons")}
                        </div>
                        <div className="text-sm font-semibold text-charcoal">{cake.persons}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CTA buttons */}
              <div className={cn("flex flex-col sm:flex-row gap-3 w-full pt-2", isRTL && "sm:flex-row-reverse")}>
                <a
                  href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#25D366] text-white font-semibold hover:bg-[#20BD5C] transition-colors shadow-md text-base"
                >
                  <MessageCircle size={20} />
                  {lbl("order")}
                </a>
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-surface-alt text-charcoal font-semibold hover:bg-rose hover:text-white transition-colors border border-border text-base"
                >
                  <Phone size={18} />
                  {lbl("call")}
                </a>
              </div>

              {/* Note */}
              <p className="text-xs text-charcoal-lighter">
                {locale === "ar"
                  ? "كل الكعكات مصنوعة يدوياً حسب الطلب. اتصل بنا للحصول على السعر وتفاصيل التوصيل."
                  : locale === "en"
                  ? "All cakes are handmade to order. Contact us for pricing and delivery details."
                  : "Tous les gâteaux sont faits main sur commande. Contactez-nous pour le prix et les détails de livraison."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Similar cakes */}
      {similar.length > 0 && (
        <section className="py-12 bg-surface-alt border-t border-border">
          <div className="container-custom">
            <h2 className={cn("font-playfair text-2xl font-bold text-charcoal mb-8", isRTL && "text-right")}>
              {lbl("similar")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similar.map((s) => {
                const st = s.translations[locale as Locale] ?? s.translations.fr;
                return (
                  <Link
                    key={s.id}
                    href={`${prefix}/galerie/${s.slug}`}
                    className="cake-card group block"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={s.images[0]}
                        alt={st.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-4 py-1.5 bg-white text-rose text-xs font-medium rounded-full">
                          {lbl("view")}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-playfair font-semibold text-charcoal group-hover:text-rose transition-colors line-clamp-1">
                        {st.title}
                      </h3>
                      <p className="text-xs text-charcoal-light mt-1">
                        {s.categoryLabel[locale as Locale] ?? s.categoryLabel.fr}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
