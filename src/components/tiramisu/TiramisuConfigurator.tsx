"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { MessageCircle, Sparkles, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/constants";
import TiramisuPreview from "./TiramisuPreview";
import {
  TIRAMISU_SIZES,
  TIRAMISU_BOXES,
  TIRAMISU_IMAGES,
  STYLE_META,
  sanitizeTiramisuText,
  type Locale,
  type TiramisuStyle,
  type TiramisuSizeId,
} from "@/lib/tiramisu-config";

const EASE = [0.16, 1, 0.3, 1] as const;

const T = {
  badge: { fr: "Atelier Tiramisu", ar: "ورشة التيراميسو", en: "Tiramisu Workshop" },
  designTitle: {
    fr: "Personnalisez votre tiramisu",
    ar: "صمّم تيراميسو الخاص بك",
    en: "Design your own tiramisu",
  },
  designSub: {
    fr: "Écrivez, choisissez le style et voyez le résultat en direct.",
    ar: "اكتب، اختر النمط، وشاهد النتيجة مباشرة.",
    en: "Type it, pick the style, and watch it come to life.",
  },
  step1: { fr: "1 · Le style", ar: "1 · النمط", en: "1 · The style" },
  step2: { fr: "2 · La taille", ar: "2 · الحجم", en: "2 · The size" },
  step3: { fr: "3 · Votre texte", ar: "3 · نصّك", en: "3 · Your text" },
  placeholder: { fr: "Tapez ici…", ar: "اكتب هنا…", en: "Type here…" },
  sample: { fr: "KIKIM", ar: "KIKIM", en: "KIKIM" },
  charsLeft: { fr: "caractères restants", ar: "حرفًا متبقيًا", en: "characters left" },
  lineLimit: {
    fr: "Appuyez sur Entrée pour une nouvelle ligne",
    ar: "اضغط Enter لسطر جديد",
    en: "Press Enter for a new line",
  },
  order: {
    fr: "Commander ce tiramisu",
    ar: "اطلب هذا التيراميسو",
    en: "Order this tiramisu",
  },
  emptyHint: {
    fr: "Écrivez un mot pour l'aperçu",
    ar: "اكتب كلمة لمعاينتها",
    en: "Write something to preview",
  },
  boxesTitle: {
    fr: "Ou commandez une boîte classique",
    ar: "أو اطلب علبة كلاسيكية",
    en: "Or order a classic box",
  },
  boxesSub: {
    fr: "Notre tiramisu maison, simple et irrésistible — sans personnalisation.",
    ar: "تيراميسو منزلي الصنع، بسيط ولا يُقاوم — بدون تخصيص.",
    en: "Our homemade tiramisu, simple and irresistible — no personalization.",
  },
  quantity: { fr: "Quantité", ar: "الكمية", en: "Quantity" },
  orderBox: { fr: "Commander", ar: "اطلب", en: "Order" },
  priceNote: {
    fr: "Prix sur devis — on vous répond en quelques minutes.",
    ar: "السعر حسب الطلب — نردّ عليك خلال دقائق.",
    en: "Price on request — we reply within minutes.",
  },
};

function greeting(locale: string) {
  return locale === "ar"
    ? "مرحباً Gateaux Patience! أودّ أن أطلب تيراميسو:"
    : locale === "en"
    ? "Hello Gateaux Patience! I'd like to order a tiramisu:"
    : "Bonjour Gateaux Patience ! Je souhaite commander un tiramisu :";
}

function waLink(text: string) {
  return `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    text
  )}`;
}

export default function TiramisuConfigurator() {
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";

  const [style, setStyle] = useState<TiramisuStyle>("cacao");
  const [sizeId, setSizeId] = useState<TiramisuSizeId>("large");
  const [raw, setRaw] = useState("");

  const size = TIRAMISU_SIZES.find((s) => s.id === sizeId)!;
  const text = useMemo(
    () => sanitizeTiramisuText(raw, style, size),
    [raw, style, size]
  );

  const maxTotal = size.charsPerLine[style] * size.maxLines;
  const used = text.replace(/\n/g, "").length;
  const remaining = Math.max(0, maxTotal - used);

  function onTextChange(v: string) {
    setRaw(sanitizeTiramisuText(v, style, size));
  }

  // Re-clamp text when style/size shrink the limits.
  function changeStyle(s: TiramisuStyle) {
    setStyle(s);
    setRaw((r) => sanitizeTiramisuText(r, s, size));
  }
  function changeSize(id: TiramisuSizeId) {
    const next = TIRAMISU_SIZES.find((s) => s.id === id)!;
    setSizeId(id);
    setRaw((r) => sanitizeTiramisuText(r, style, next));
  }

  const orderText = useMemo(() => {
    const styleLabel = STYLE_META[style].labels[locale];
    const sizeLabel = size.labels[locale];
    const lines = [
      greeting(locale),
      "",
      `• ${STYLE_META[style].emoji} ${styleLabel}`,
      `• ${sizeLabel}`,
      `• "${text.replace(/\n/g, " / ") || "…"}"`,
    ];
    return lines.join("\n");
  }, [style, size, text, locale]);

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        {/* ---- Preview (sticky on desktop, on top on mobile) ---- */}
        <div className="lg:sticky lg:top-24">
          <div className="relative mx-auto max-w-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <TiramisuPreview
                style={style}
                size={size}
                text={text}
                placeholder={T.sample[locale]}
                imageSrc={TIRAMISU_IMAGES[style]}
              />
            </motion.div>
            {text.trim().length === 0 && (
              <p className="mt-4 text-center text-sm text-charcoal-light">
                {T.emptyHint[locale]}
              </p>
            )}
          </div>
        </div>

        {/* ---- Controls ---- */}
        <div className="space-y-8">
          {/* Style */}
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-rose">
              {T.step1[locale]}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(Object.keys(STYLE_META) as TiramisuStyle[]).map((s) => {
                const meta = STYLE_META[s];
                const active = style === s;
                return (
                  <button
                    key={s}
                    onClick={() => changeStyle(s)}
                    className={cn(
                      "rounded-2xl border p-4 text-start transition-all duration-300",
                      active
                        ? "border-rose bg-rose/5 shadow-cake -translate-y-0.5"
                        : "border-border bg-white hover:border-rose/50"
                    )}
                  >
                    <span className="text-2xl">{meta.emoji}</span>
                    <span className="mt-2 block font-playfair font-semibold text-charcoal">
                      {meta.labels[locale]}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-charcoal-light">
                      {meta.desc[locale]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size */}
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-rose">
              {T.step2[locale]}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {TIRAMISU_SIZES.map((s) => {
                const active = sizeId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => changeSize(s.id)}
                    className={cn(
                      "rounded-2xl border px-3 py-4 text-center transition-all duration-300",
                      active
                        ? "border-gold bg-gold/10 shadow-gold -translate-y-0.5"
                        : "border-border bg-white hover:border-gold/50"
                    )}
                  >
                    <span className="block font-playfair font-bold text-charcoal">
                      {s.labels[locale]}
                    </span>
                    <span className="mt-1 block text-[11px] text-charcoal-light">
                      {s.hint[locale]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-rose">
              {T.step3[locale]}
            </p>
            <textarea
              value={raw}
              onChange={(e) => onTextChange(e.target.value)}
              rows={size.maxLines}
              placeholder={T.placeholder[locale]}
              dir={isRTL ? "rtl" : "ltr"}
              className="w-full resize-none rounded-2xl border border-border bg-white px-4 py-3 font-playfair text-lg text-charcoal outline-none transition-colors focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-charcoal-light">
              <span>
                {size.maxLines > 1 ? T.lineLimit[locale] : " "}
              </span>
              <span
                className={cn(
                  "font-medium tabular-nums",
                  remaining === 0 && "text-rose"
                )}
              >
                {remaining} {T.charsLeft[locale]}
              </span>
            </div>
          </div>

          {/* Order */}
          <div className="rounded-2xl border border-border bg-surface-alt p-5">
            <a
              href={waLink(orderText)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 font-semibold text-white shadow-lg transition-all hover:bg-[#1ebd5c] hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageCircle size={20} />
              {T.order[locale]}
            </a>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-charcoal-light">
              <Sparkles size={13} className="text-gold" />
              {T.priceNote[locale]}
            </p>
          </div>
        </div>
      </div>

      {/* ---- Casual boxes ---- */}
      <CasualBoxes locale={locale} isRTL={isRTL} />
    </div>
  );
}

function CasualBoxes({ locale, isRTL }: { locale: Locale; isRTL: boolean }) {
  return (
    <div className="mt-20 border-t border-border pt-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="section-title">{T.boxesTitle[locale]}</h2>
        <p className="section-subtitle mx-auto mt-3">{T.boxesSub[locale]}</p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {TIRAMISU_BOXES.map((box, i) => (
          <BoxCard key={box.id} box={box} locale={locale} index={i} isRTL={isRTL} />
        ))}
      </div>
    </div>
  );
}

function BoxCard({
  box,
  locale,
  index,
  isRTL,
}: {
  box: (typeof TIRAMISU_BOXES)[number];
  locale: Locale;
  index: number;
  isRTL: boolean;
}) {
  const [qty, setQty] = useState(1);

  const orderText = [
    greeting(locale),
    "",
    `• ${box.emoji} ${box.labels[locale]} (${box.portions[locale]})`,
    `• ${T.quantity[locale]}: ${qty}`,
  ].join("\n");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
      className="cake-card flex flex-col items-center p-6 text-center"
    >
      <span className="text-4xl">{box.emoji}</span>
      <h3 className="mt-3 font-playfair text-xl font-semibold text-charcoal">
        {box.labels[locale]}
      </h3>
      <p className="mt-1 text-sm text-charcoal-light">{box.portions[locale]}</p>

      <div
        className={cn(
          "mt-5 flex items-center gap-3",
          isRTL && "flex-row-reverse"
        )}
      >
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="-"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-charcoal transition-colors hover:border-rose hover:text-rose"
        >
          <Minus size={15} />
        </button>
        <span className="w-8 text-center font-semibold tabular-nums">{qty}</span>
        <button
          onClick={() => setQty((q) => Math.min(50, q + 1))}
          aria-label="+"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-charcoal transition-colors hover:border-rose hover:text-rose"
        >
          <Plus size={15} />
        </button>
      </div>

      <a
        href={waLink(orderText)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary mt-5 w-full justify-center"
      >
        <MessageCircle size={16} />
        {T.orderBox[locale]}
      </a>
    </motion.div>
  );
}
