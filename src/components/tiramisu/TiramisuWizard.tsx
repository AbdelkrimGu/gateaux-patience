"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  Pencil,
  Check,
  ShoppingBag,
  Sparkles,
  PartyPopper,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TIRAMISU_CATALOG,
  formatDA,
  findOption,
} from "@/lib/tiramisu-catalog";
import { STYLE_META, type Locale } from "@/lib/tiramisu-config";
import ItemCustomizer, {
  personalizationText,
  type Personalization,
} from "./ItemCustomizer";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Step = "mode" | "boxes" | "bucket" | "review" | "confirm";
type Mode = "simple" | "custom";
const STEP_ORDER: Step[] = ["mode", "boxes", "bucket", "review", "confirm"];

interface BucketItem {
  uid: string;
  optionId: string;
  qty: number;
  personalization: Personalization | null;
}

export default function TiramisuWizard() {
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";
  const t = (fr: string, ar: string, en: string) =>
    locale === "ar" ? ar : locale === "en" ? en : fr;
  const homeHref = locale === "fr" ? "/" : `/${locale}`;

  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<Mode>("custom");
  const [bucket, setBucket] = useState<BucketItem[]>([]);
  const [activeCat, setActiveCat] = useState(TIRAMISU_CATALOG[0].id);
  const [customizingUid, setCustomizingUid] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const uidRef = useRef(0);
  const newUid = () => `b${++uidRef.current}`;

  const count = useMemo(() => bucket.reduce((n, b) => n + b.qty, 0), [bucket]);
  const total = useMemo(
    () =>
      bucket.reduce((sum, b) => {
        const f = findOption(b.optionId);
        return sum + (f ? f.option.price * b.qty : 0);
      }, 0),
    [bucket]
  );

  // ---- bucket ops ----
  function addToBucket(optionId: string) {
    setBucket((prev) => {
      const existing = prev.find(
        (b) => b.optionId === optionId && !b.personalization
      );
      if (existing) {
        return prev.map((b) =>
          b === existing ? { ...b, qty: b.qty + 1 } : b
        );
      }
      return [...prev, { uid: newUid(), optionId, qty: 1, personalization: null }];
    });
  }
  function setQty(uid: string, delta: number) {
    setBucket((prev) =>
      prev.map((b) =>
        b.uid === uid ? { ...b, qty: Math.max(1, b.qty + delta) } : b
      )
    );
  }
  function removeItem(uid: string) {
    setBucket((prev) => prev.filter((b) => b.uid !== uid));
  }
  function savePersonalization(uid: string, p: Personalization) {
    setBucket((prev) =>
      prev.map((b) => (b.uid === uid ? { ...b, personalization: p } : b))
    );
    setCustomizingUid(null);
  }

  // ---- order message ----
  function buildOrder() {
    const head = t("Commande Tiramisu", "طلب تيراميسو", "Tiramisu order");
    const modeLabel =
      mode === "custom"
        ? t("Personnalisé", "مخصّص", "Personalized")
        : t("Simple", "بسيط", "Simple");
    const rows: string[] = [`${head} — ${modeLabel}`, ""];
    bucket.forEach((b) => {
      const f = findOption(b.optionId);
      if (!f) return;
      const label = `${f.category.labels[locale]} · ${f.option.shapeLabel[locale]}`;
      const line =
        b.qty > 1
          ? `${b.qty}× ${label} — ${formatDA(f.option.price)} = ${formatDA(
              f.option.price * b.qty
            )}`
          : `1× ${label} — ${formatDA(f.option.price)}`;
      rows.push(`• ${line}`);
      if (b.personalization) {
        const txt = personalizationText(b.personalization).replace(/\n/g, " / ");
        if (txt) {
          rows.push(
            `   ✍️ ${STYLE_META[b.personalization.style].labels[locale]}: "${txt}"`
          );
        }
      }
    });
    rows.push("", `${t("Total", "المجموع", "Total")}: ${formatDA(total)}`);
    return {
      message: rows.join("\n"),
      cakeTitle: `${t("Tiramisu", "تيراميسو", "Tiramisu")} — ${count} ${t(
        "article(s)",
        "عنصر",
        "item(s)"
      )}`,
    };
  }

  const phoneDigits = phone.replace(/\D/g, "");
  const canSubmit = name.trim().length > 0 && phoneDigits.length >= 6 && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const { message, cakeTitle } = buildOrder();
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), message, cakeTitle }),
      });
      if (!res.ok) throw new Error("bad status");
      const data = (await res.json()) as { id?: string };
      setDoneId(data.id ?? "ok");
    } catch {
      setError(
        t(
          "Échec de l'envoi. Vérifiez votre connexion et réessayez.",
          "فشل الإرسال. تحقق من اتصالك وحاول مجددًا.",
          "Sending failed. Check your connection and try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setBucket([]);
    setName("");
    setPhone("");
    setDoneId(null);
    setError(null);
    setStep("mode");
  }

  function goBack() {
    const i = STEP_ORDER.indexOf(step);
    if (i > 0) setStep(STEP_ORDER[i - 1]);
  }

  const customizingItem = customizingUid
    ? bucket.find((b) => b.uid === customizingUid)
    : null;
  const customizingOption = customizingItem
    ? findOption(customizingItem.optionId)
    : null;

  const stepIndex = STEP_ORDER.indexOf(step);

  // ============ SUCCESS ============
  if (doneId) {
    return (
      <Shell isRTL={isRTL}>
        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-rose text-white shadow-cake"
          >
            <PartyPopper size={36} />
          </motion.div>
          <h2 className="mt-6 font-playfair text-2xl font-bold text-charcoal">
            {t("Commande enregistrée !", "تم تسجيل الطلب!", "Order registered!")}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-charcoal-light">
            {t(
              "Merci ! Nous avons bien reçu votre commande et nous vous contactons très vite pour la confirmer.",
              "شكرًا! استلمنا طلبك وسنتواصل معك قريبًا جدًا لتأكيده.",
              "Thank you! We received your order and will contact you very soon to confirm it."
            )}
          </p>
          <span className="mt-4 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-charcoal-light ring-1 ring-border">
            {t("Référence", "المرجع", "Reference")}: {doneId.slice(0, 8).toUpperCase()}
          </span>
          <button
            onClick={reset}
            className="btn-gold mt-8"
          >
            {t("Nouvelle commande", "طلب جديد", "New order")}
          </button>
          <Link href={homeHref} className="mt-4 text-sm text-charcoal-light hover:text-rose">
            {t("Retour à l'accueil", "العودة للرئيسية", "Back home")}
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell isRTL={isRTL}>
      {/* Top bar */}
      <header className="relative z-20 flex shrink-0 items-center justify-between px-4 py-3">
        {step === "mode" ? (
          <Link
            href={homeHref}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-charcoal-light ring-1 ring-border backdrop-blur-sm transition-colors hover:text-rose"
            aria-label={t("Accueil", "الرئيسية", "Home")}
          >
            <ArrowLeft size={18} className={isRTL ? "rotate-180" : ""} />
          </Link>
        ) : (
          <button
            onClick={goBack}
            className="flex h-9 items-center gap-1.5 rounded-full bg-white/70 px-3 text-sm font-medium text-charcoal ring-1 ring-border backdrop-blur-sm transition-colors hover:text-rose"
          >
            <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
            {t("Retour", "رجوع", "Back")}
          </button>
        )}

        {/* progress dots */}
        <div className="flex items-center gap-1.5">
          {STEP_ORDER.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === stepIndex ? "w-5 bg-rose" : i < stepIndex ? "w-1.5 bg-rose/50" : "w-1.5 bg-charcoal/15"
              )}
            />
          ))}
        </div>

        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-border">
          <Image src="/Logo/Logo-Photoroom.png" alt="Gateaux Patience" width={36} height={36} className="h-full w-full object-cover" />
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="flex h-full flex-col"
          >
            {step === "mode" && (
              <ModeStep
                t={t}
                onPick={(m) => {
                  setMode(m);
                  setStep("boxes");
                }}
              />
            )}

            {step === "boxes" && (
              <BoxesStep
                t={t}
                locale={locale}
                activeCat={activeCat}
                setActiveCat={setActiveCat}
                onAdd={addToBucket}
                count={count}
                total={total}
                onContinue={() => setStep("bucket")}
              />
            )}

            {step === "bucket" && (
              <BucketStep
                t={t}
                locale={locale}
                bucket={bucket}
                mode={mode}
                total={total}
                setQty={setQty}
                removeItem={removeItem}
                onPersonalize={(uid) => setCustomizingUid(uid)}
                onAddMore={() => setStep("boxes")}
                onContinue={() => setStep("review")}
              />
            )}

            {step === "review" && (
              <ReviewStep
                t={t}
                locale={locale}
                bucket={bucket}
                total={total}
                onConfirm={() => setStep("confirm")}
              />
            )}

            {step === "confirm" && (
              <ConfirmStep
                t={t}
                isRTL={isRTL}
                name={name}
                phone={phone}
                setName={setName}
                setPhone={setPhone}
                total={total}
                count={count}
                canSubmit={canSubmit}
                submitting={submitting}
                error={error}
                onSubmit={submit}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Customizer overlay */}
        <AnimatePresence>
          {customizingItem && customizingOption && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="absolute inset-0 z-30 flex flex-col bg-background"
            >
              <ItemCustomizer
                initial={customizingItem.personalization}
                optionLabel={`${customizingOption.category.labels[locale]} · ${customizingOption.option.shapeLabel[locale]}`}
                onSave={(p) => savePersonalization(customizingItem.uid, p)}
                onCancel={() => setCustomizingUid(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </Shell>
  );
}

// ============ Shell ============
function Shell({ children, isRTL }: { children: React.ReactNode; isRTL: boolean }) {
  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-b from-[#FBF5EE] via-[#FAF1E8] to-[#F8E9DD]"
    >
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-20" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #E8A3A8, transparent)" }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

// ============ Footer bar ============
function FooterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 shrink-0 border-t border-border/70 bg-white/80 px-4 py-3 backdrop-blur-sm">
      {children}
    </div>
  );
}

type TFn = (fr: string, ar: string, en: string) => string;

// ============ Step: Mode ============
function ModeStep({ t, onPick }: { t: TFn; onPick: (m: Mode) => void }) {
  const cards: { mode: Mode; emoji: string; title: string; desc: string; img: string }[] = [
    {
      mode: "simple",
      emoji: "🥄",
      title: t("Tiramisu simple", "تيراميسو بسيط", "Simple tiramisu"),
      desc: t(
        "Nos boîtes gourmandes, prêtes à savourer.",
        "علبنا اللذيذة، جاهزة للتذوّق.",
        "Our gourmet boxes, ready to enjoy."
      ),
      img: "/images/tiramisu/boxes/ind-trio.jpg",
    },
    {
      mode: "custom",
      emoji: "✍️",
      title: t("Tiramisu personnalisé", "تيراميسو مخصّص", "Custom tiramisu"),
      desc: t(
        "Écrivez votre message et voyez-le en direct.",
        "اكتب رسالتك وشاهدها مباشرة.",
        "Write your message and see it live."
      ),
      img: "/images/tiramisu/hero/hero-1.png",
    },
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center px-5 pb-6">
      <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/65 px-3.5 py-1 text-[10px] uppercase tracking-[0.28em] text-charcoal-light ring-1 ring-rose/15">
        <span className="h-1 w-1 rounded-full bg-gold" />
        {t("Atelier Tiramisu", "ورشة التيراميسو", "Tiramisu Workshop")}
      </span>
      <h1 className="text-center font-playfair text-3xl font-bold leading-tight text-charcoal">
        {t("Que désirez-vous ?", "ماذا تريد؟", "What would you like?")}
      </h1>
      <p className="mt-2 max-w-xs text-center text-sm text-charcoal-light">
        {t(
          "Choisissez par où commencer.",
          "اختر من أين تبدأ.",
          "Choose where to begin."
        )}
      </p>

      <div className="mt-7 grid w-full max-w-md gap-4">
        {cards.map((c) => (
          <button
            key={c.mode}
            onClick={() => onPick(c.mode)}
            className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-border bg-white p-3 text-start shadow-cake transition-all hover:-translate-y-0.5 hover:border-rose/40 hover:shadow-cake-hover active:scale-[0.99]"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
              <Image src={c.img} alt={c.title} fill sizes="80px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{c.emoji}</span>
                <h2 className="font-playfair text-lg font-semibold text-charcoal">{c.title}</h2>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-charcoal-light">{c.desc}</p>
            </div>
            <ArrowRight size={18} className="shrink-0 text-rose transition-transform group-hover:translate-x-1 rtl:rotate-180" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ Step: Boxes ============
function BoxesStep({
  t,
  locale,
  activeCat,
  setActiveCat,
  onAdd,
  count,
  total,
  onContinue,
}: {
  t: TFn;
  locale: Locale;
  activeCat: string;
  setActiveCat: (id: string) => void;
  onAdd: (optionId: string) => void;
  count: number;
  total: number;
  onContinue: () => void;
}) {
  const category = TIRAMISU_CATALOG.find((c) => c.id === activeCat)!;
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-1">
        <h2 className="font-playfair text-xl font-bold text-charcoal">
          {t("Choisissez vos boîtes", "اختر علبك", "Choose your boxes")}
        </h2>
        <p className="text-xs text-charcoal-light">
          {t(
            "Ajoutez-en autant que vous voulez.",
            "أضف ما شئت منها.",
            "Add as many as you like."
          )}
        </p>
      </div>

      {/* Category tabs */}
      <div className="mt-3 flex shrink-0 gap-2 overflow-x-auto px-5 pb-1">
        {TIRAMISU_CATALOG.map((c) => {
          const active = c.id === activeCat;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "border-rose bg-rose text-white shadow-cake"
                  : "border-border bg-white text-charcoal-light"
              )}
            >
              {c.labels[locale]}
              <span className={cn("ms-1.5 text-[11px]", active ? "text-white/80" : "text-charcoal-lighter")}>
                {c.portions[locale]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Shape scroller */}
      <div className="flex min-h-0 flex-1 items-center">
        <div className="flex w-full snap-x gap-4 overflow-x-auto px-5 py-2">
          {category.options.map((o) => (
            <div
              key={o.id}
              className="flex w-[62vw] max-w-[260px] shrink-0 snap-center flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-cake"
            >
              <div className="relative aspect-square w-full">
                <Image src={o.image} alt={o.shapeLabel[locale]} fill sizes="260px" className="object-cover" />
                <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-charcoal shadow">
                  {o.shapeLabel[locale]}
                </span>
                {o.customizable && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-rose/90 px-2 py-0.5 text-[10px] font-medium text-white">
                    <Pencil size={10} /> {t("Perso.", "تخصيص", "Custom")}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="font-playfair text-base font-bold text-charcoal">{formatDA(o.price)}</span>
                <button
                  onClick={() => onAdd(o.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-rose px-3.5 py-2 text-sm font-semibold text-white shadow-cake transition-all hover:bg-rose-dark active:scale-95"
                >
                  <Plus size={15} /> {t("Ajouter", "أضف", "Add")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FooterBar>
        <button
          onClick={onContinue}
          disabled={count === 0}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-semibold text-white transition-all",
            count === 0
              ? "cursor-not-allowed bg-charcoal/25"
              : "bg-gradient-to-br from-rose to-[#B05161] shadow-cake hover:shadow-cake-hover active:scale-[0.99]"
          )}
        >
          <ShoppingBag size={18} />
          {count === 0
            ? t("Ajoutez une boîte", "أضف علبة", "Add a box")
            : `${t("Voir le panier", "عرض السلة", "View bucket")} · ${count} · ${formatDA(total)}`}
          {count > 0 && <ArrowRight size={16} className="rtl:rotate-180" />}
        </button>
      </FooterBar>
    </div>
  );
}

// ============ Step: Bucket ============
function BucketStep({
  t,
  locale,
  bucket,
  mode,
  total,
  setQty,
  removeItem,
  onPersonalize,
  onAddMore,
  onContinue,
}: {
  t: TFn;
  locale: Locale;
  bucket: BucketItem[];
  mode: Mode;
  total: number;
  setQty: (uid: string, d: number) => void;
  removeItem: (uid: string) => void;
  onPersonalize: (uid: string) => void;
  onAddMore: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-1">
        <div>
          <h2 className="font-playfair text-xl font-bold text-charcoal">
            {t("Votre panier", "سلتك", "Your bucket")}
          </h2>
          <p className="text-xs text-charcoal-light">
            {mode === "custom"
              ? t(
                  "Touchez « Personnaliser » sur les boîtes à écrire.",
                  "اضغط «تخصيص» على العلب القابلة للكتابة.",
                  "Tap “Customize” on the writable boxes."
                )
              : t("Ajustez les quantités.", "عدّل الكميات.", "Adjust quantities.")}
          </p>
        </div>
        <button onClick={onAddMore} className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-charcoal-light hover:border-rose hover:text-rose">
          <Plus size={13} /> {t("Ajouter", "أضف", "Add")}
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-5 py-3">
        {bucket.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-charcoal-light">
            <ShoppingBag size={36} className="opacity-40" />
            <p className="mt-2 text-sm">{t("Panier vide", "السلة فارغة", "Bucket empty")}</p>
          </div>
        )}
        {bucket.map((b) => {
          const f = findOption(b.optionId);
          if (!f) return null;
          const { category, option } = f;
          const ptext = b.personalization ? personalizationText(b.personalization) : "";
          return (
            <div key={b.uid} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex gap-3 p-2.5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Image src={option.image} alt={option.shapeLabel[locale]} fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-playfair text-sm font-semibold text-charcoal">
                        {category.labels[locale]} · {option.shapeLabel[locale]}
                      </p>
                      <p className="text-xs text-charcoal-light">{formatDA(option.price)}</p>
                    </div>
                    <button onClick={() => removeItem(b.uid)} className="shrink-0 rounded-lg p-1.5 text-charcoal-lighter hover:bg-red-50 hover:text-red-500" aria-label="Remove">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQty(b.uid, -1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-charcoal hover:border-rose hover:text-rose" aria-label="-">
                        <Minus size={13} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold tabular-nums">{b.qty}</span>
                      <button onClick={() => setQty(b.uid, 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-charcoal hover:border-rose hover:text-rose" aria-label="+">
                        <Plus size={13} />
                      </button>
                    </div>
                    {mode === "custom" && option.customizable && (
                      <button
                        onClick={() => onPersonalize(b.uid)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                          b.personalization
                            ? "bg-rose/10 text-rose"
                            : "bg-rose text-white hover:bg-rose-dark"
                        )}
                      >
                        <Pencil size={12} />
                        {b.personalization
                          ? t("Modifier", "تعديل", "Edit")
                          : t("Personnaliser", "تخصيص", "Customize")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {b.personalization && ptext && (
                <div className="border-t border-border/70 bg-rose/[0.04] px-3 py-1.5">
                  <p className="truncate text-xs text-charcoal-light">
                    <span className="me-1">{STYLE_META[b.personalization.style].emoji}</span>
                    “{ptext.replace(/\n/g, " · ")}”
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <FooterBar>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-charcoal-light">{t("Total", "المجموع", "Total")}</span>
          <span className="font-playfair text-lg font-bold text-charcoal">{formatDA(total)}</span>
        </div>
        <button
          onClick={onContinue}
          disabled={bucket.length === 0}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-semibold text-white transition-all",
            bucket.length === 0 ? "cursor-not-allowed bg-charcoal/25" : "bg-gradient-to-br from-rose to-[#B05161] shadow-cake hover:shadow-cake-hover active:scale-[0.99]"
          )}
        >
          {t("Continuer", "متابعة", "Continue")}
          <ArrowRight size={16} className="rtl:rotate-180" />
        </button>
      </FooterBar>
    </div>
  );
}

// ============ Step: Review ============
function ReviewStep({
  t,
  locale,
  bucket,
  total,
  onConfirm,
}: {
  t: TFn;
  locale: Locale;
  bucket: BucketItem[];
  total: number;
  onConfirm: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-1">
        <h2 className="font-playfair text-xl font-bold text-charcoal">
          {t("Votre commande", "طلبك", "Your order")}
        </h2>
        <p className="text-xs text-charcoal-light">
          {t("Vérifiez avant de confirmer.", "تحقق قبل التأكيد.", "Check before confirming.")}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-3">
        {bucket.map((b) => {
          const f = findOption(b.optionId);
          if (!f) return null;
          const { category, option } = f;
          const ptext = b.personalization ? personalizationText(b.personalization) : "";
          return (
            <div key={b.uid} className="rounded-2xl border border-border bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-playfair text-sm font-semibold text-charcoal">
                  <span className="text-rose">{b.qty}×</span> {category.labels[locale]} · {option.shapeLabel[locale]}
                </p>
                <span className="text-sm font-semibold text-charcoal">{formatDA(option.price * b.qty)}</span>
              </div>
              {b.personalization && ptext && (
                <p className="mt-1 text-xs text-charcoal-light">
                  {STYLE_META[b.personalization.style].emoji} {STYLE_META[b.personalization.style].labels[locale]}: “{ptext.replace(/\n/g, " · ")}”
                </p>
              )}
            </div>
          );
        })}
      </div>

      <FooterBar>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-charcoal-light">{t("Total", "المجموع", "Total")}</span>
          <span className="font-playfair text-xl font-bold text-rose">{formatDA(total)}</span>
        </div>
        <button
          onClick={onConfirm}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-rose to-[#B05161] py-3.5 font-semibold text-white shadow-cake transition-all hover:shadow-cake-hover active:scale-[0.99]"
        >
          <Check size={18} />
          {t("Confirmer la commande", "تأكيد الطلب", "Confirm order")}
        </button>
      </FooterBar>
    </div>
  );
}

// ============ Step: Confirm (name + phone) ============
function ConfirmStep({
  t,
  isRTL,
  name,
  phone,
  setName,
  setPhone,
  total,
  count,
  canSubmit,
  submitting,
  error,
  onSubmit,
}: {
  t: TFn;
  isRTL: boolean;
  name: string;
  phone: string;
  setName: (v: string) => void;
  setPhone: (v: string) => void;
  total: number;
  count: number;
  canSubmit: boolean;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-1">
        <h2 className="font-playfair text-xl font-bold text-charcoal">
          {t("Vos coordonnées", "معلوماتك", "Your details")}
        </h2>
        <p className="text-xs text-charcoal-light">
          {t(
            "Pour confirmer votre commande avec vous.",
            "لتأكيد طلبك معك.",
            "So we can confirm your order with you."
          )}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-charcoal-light">
            {t("Votre nom", "اسمك", "Your name")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("Nom et prénom", "الاسم الكامل", "Full name")}
            dir={isRTL ? "rtl" : "ltr"}
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-charcoal outline-none transition-colors focus:border-rose focus:ring-2 focus:ring-rose/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-charcoal-light">
            {t("Votre téléphone", "هاتفك", "Your phone")}
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            placeholder="05 00 00 00 00"
            dir="ltr"
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-charcoal outline-none transition-colors focus:border-rose focus:ring-2 focus:ring-rose/20"
          />
        </div>

        <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-border">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-charcoal-light">
              <ShoppingBag size={15} /> {count} {t("article(s)", "عنصر", "item(s)")}
            </span>
            <span className="font-playfair text-lg font-bold text-charcoal">{formatDA(total)}</span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-charcoal-light">
            <Sparkles size={12} className="text-gold" />
            {t(
              "Aucun paiement maintenant — nous vous rappelons pour confirmer.",
              "لا دفع الآن — سنتصل بك للتأكيد.",
              "No payment now — we call you back to confirm."
            )}
          </p>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <FooterBar>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-semibold text-white transition-all",
            !canSubmit ? "cursor-not-allowed bg-charcoal/25" : "bg-gradient-to-br from-rose to-[#B05161] shadow-cake hover:shadow-cake-hover active:scale-[0.99]"
          )}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t("Envoi…", "جارٍ الإرسال…", "Sending…")}
            </>
          ) : (
            <>
              <Check size={18} />
              {t("Enregistrer ma commande", "تسجيل طلبي", "Register my order")}
            </>
          )}
        </button>
      </FooterBar>
    </div>
  );
}
