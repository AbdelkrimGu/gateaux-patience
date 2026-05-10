"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/constants";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const GALLERY_PREVIEW = [
  "/images/Cake2/FB_IMG_1778412946778.jpg",
  "/images/Cake4/FB_IMG_1778413022968.jpg",
  "/images/Cake5/FB_IMG_1778413047112.jpg",
  "/images/Cake6/FB_IMG_1778413108324.jpg",
  "/images/Cake9/FB_IMG_1778413218708.jpg",
  "/images/Cake15/FB_IMG_1778413532329.jpg",
];

export default function SocialCTASection() {
  const t = useTranslations("social");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const socialLinks = [
    {
      name: t("facebook"),
      href: CONTACT.facebook,
      icon: <FacebookIcon className="w-5 h-5" />,
      color: "bg-[#1877F2] hover:bg-[#166FE5]",
    },
    {
      name: t("instagram"),
      href: CONTACT.instagram,
      icon: <InstagramIcon className="w-5 h-5" />,
      color: "bg-gradient-to-br from-[#F77737] via-[#C32AA3] to-[#4F5BD5] hover:opacity-90",
    },
    {
      name: t("whatsapp"),
      href: `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`,
      icon: <WhatsAppIcon className="w-5 h-5" />,
      color: "bg-[#25D366] hover:bg-[#20BD5C]",
    },
    {
      name: t("call"),
      href: `tel:${CONTACT.phone}`,
      icon: <Phone size={18} />,
      color: "bg-rose hover:bg-rose-dark",
    },
  ];

  return (
    <section className="section-padding bg-charcoal relative overflow-hidden">
      {/* Decorative */}
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #C9727A, transparent)" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }}
        aria-hidden="true"
      />

      <div className="container-custom relative z-10">
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-2 gap-16 items-center",
          )}
        >
          {/* Text + CTAs */}
          <div
            ref={ref}
            className={cn(
              "flex flex-col gap-6",
              isRTL ? "items-end text-right" : "items-start",
              inView ? "animate-slide-up" : "opacity-0"
            )}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-white/80 border border-white/20 mb-2">
              {t("badge")}
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white">
              {t("title")}{" "}
              <span className="text-gradient">{t("titleAccent")}</span>
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-md">
              {t("subtitle")}
            </p>

            {/* Social buttons */}
            <div className={cn("flex flex-wrap gap-3 mt-2", isRTL && "flex-row-reverse")}>
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-3 rounded-full text-white text-sm font-medium transition-all duration-300 hover:-translate-y-0.5",
                    link.color
                  )}
                >
                  {link.icon}
                  {link.name}
                </a>
              ))}
            </div>

            {/* Contact info */}
            <div className="flex flex-col gap-2 mt-2">
              <div className={cn("flex items-center gap-2 text-white/60 text-sm", isRTL && "flex-row-reverse")}>
                <Phone size={14} className="text-rose" />
                <span>{CONTACT.phone}</span>
              </div>
            </div>
          </div>

          {/* Gallery preview grid */}
          <div
            className={cn(
              "grid grid-cols-3 gap-2 transition-all duration-1000 delay-300",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            {GALLERY_PREVIEW.map((img, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden group"
              >
                <Image
                  src={img}
                  alt={`Création ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="150px"
                />
                <div className="absolute inset-0 bg-charcoal/30 group-hover:bg-charcoal/10 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
