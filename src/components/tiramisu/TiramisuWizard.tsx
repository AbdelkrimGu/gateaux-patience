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
  WandSparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TIRAMISU_CATALOG, formatDA, findOption } from "@/lib/tiramisu-catalog";
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
  qty: number; // always 1 in custom mode (each box is its own unit)
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
  const [gateOpen, setGateOpen] = useState(false);

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

  // Customizable boxes that still have no message.
  const plainUnits = useMemo(
    () =>
      bucket.filter((b) => {
        const f = findOption(b.optionId);
        return f?.option.customizable && !b.personalization;
      }),
    [bucket]
  );

  // ---- bucket ops ----
  function addToBucket(optionId: string) {
    setBucket((prev) => {
      if (mode === "simple") {
        const ex = prev.find((b) => b.optionId === optionId && !b.personalization);
        if (ex) return prev.map((b) => (b === ex ? { ...b, qty: b.qty + 1 } : b));
      }
      // custom mode: every box is its own customizable unit
      return [...prev, { uid: newUid(), optionId, qty: 1, personalization: null }];
    });
  }
  function setQty(uid: string, delta: number) {
    setBucket((prev) =>
      prev.map((b) => (b.uid === uid ? { ...b, qty: Math.max(1, b.qty + delta) } : b))
    );
  }
  function removeItem(uid: string) {
    setBucket((prev) => prev.filter((b) => b.uid !== uid));
  }
  function savePersonalization(uid: string, p: Personalization) {
    setBucket((prev) => prev.map((b) => (b.uid === uid ? { ...b, personalization: p } : b)));
    setCustomizingUid(null);
  }
  function clearPersonalization(uid: string) {
    setBucket((prev) => prev.map((b) => (b.uid === uid ? { ...b, personalization: null } : b)));
  }
  // Switch a simple order into a personalizable one: split every multi-qty line
  // into individual units so each box can carry its own message.
  function upgradeToCustom() {
    setBucket((prev) =>
      prev.flatMap((b) =>
        Array.from({ length: b.qty }, () => ({
          uid: newUid(),
          optionId: b.optionId,
          qty: 1,
          personalization: b.personalization,
        }))
      )
    );
    setMode("custom");
  }

  // Continue from the cart — softly invite personalization if anything is plain.
  function onCartContinue() {
    if (plainUnits.length > 0) setGateOpen(true);
    else setStep("review");
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
          ? `${b.qty}× ${label} — ${formatDA(f.option.price)} = ${formatDA(f.option.price * b.qty)}`
          : `1× ${label} — ${formatDA(f.option.price)}`;
      rows.push(`• ${line}`);
      if (b.personalization) {
        const txt = personalizationText(b.personalization).replace(/\n/g, " / ");
        if (txt) rows.push(`   ✍️ ${STYLE_META[b.personalization.style].labels[locale]}: "${txt}"`);
      }
    });
    rows.push("", `${t("Total", "المجموع", "Total")}: ${formatDA(total)}`);
    return {
      message: rows.join("\n"),
      cakeTitle: `${t("Tiramisu", "تيراميسو", "Tiramisu")} — ${count} ${t("article(s)", "عنصر", "item(s)")}`,
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
    setGateOpen(false);
    setStep("mode");
  }
  function goBack() {
    const i = STEP_ORDER.indexOf(step);
    if (i > 0) setStep(STEP_ORDER[i - 1]);
  }

  const customizingItem = customizingUid ? bucket.find((b) => b.uid === customizingUid) : null;
  const customizingOption = customizingItem ? findOption(customizingItem.optionId) : null;
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
          <button onClick={reset} className="btn-gold mt-8">
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
                mode={mode}
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
                onClearPersonalization={clearPersonalization}
                onAddMore={() => setStep("boxes")}
                onContinue={onCartContinue}
              />
            )}
            {step === "review" && (
              <ReviewStep t={t} locale={locale} bucket={bucket} total={total} onConfirm={() => setStep("confirm")} />
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

        {/* Personalize gate (soft invitation on Continue) */}
        <AnimatePresence>
          {gateOpen && (
            <GateModal
              t={t}
              locale={locale}
              mode={mode}
              plainUnits={plainUnits}
              onClose={() => setGateOpen(false)}
              onUpgrade={() => {
                upgradeToCustom();
                setGateOpen(false);
              }}
              onPersonalize={(uid) => {
                setGateOpen(false);
                setCustomizingUid(uid);
              }}
              onSkip={() => {
                setGateOpen(false);
                setStep("review");
              }}
            />
          )}
        </AnimatePresence>

        {/* Customizer overlay (the loop: cart → customize → cart) */}
        <AnimatePresence>
          {customizingItem && customizingOption && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="absolute inset-0 z-40 flex flex-col bg-background"
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

function FooterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 shrink-0 border-t border-border/70 bg-white/80 px-4 py-3 backdrop-blur-sm">
      {children}
    </div>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-semibold text-white transition-all",
        disabled
          ? "cursor-not-allowed bg-charcoal/25"
          : "bg-gradient-to-br from-rose to-[#B05161] shadow-cake hover:shadow-cake-hover active:scale-[0.99]"
      )}
    >
      {children}
    </button>
  );
}

type TFn = (fr: string, ar: string, en: string) => string;

// ============ Step: Mode ============
function ModeStep({ t, onPick }: { t: TFn; onPick: (m: Mode) => void }) {
  const cards: { mode: Mode; emoji: string; title: string; desc: string; img: string }[] = [
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
    {
      mode: "simple",
      emoji: "🥄",
      title: t("Tiramisu simple", "تيراميسو بسيط", "Simple tiramisu"),
      desc: t(
        "Nos boîtes gourmandes, prêtes à savourer.",
        "علبنا اللذيذة، جاهزة للتذوّق.",
        "Our gourmet boxes, ready to enjoy."
      ),
      img: "/images/tiramisu/boxes/box-square.png",
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
        {t("Choisissez par où commencer.", "اختر من أين تبدأ.", "Choose where to begin.")}
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
  mode,
  activeCat,
  setActiveCat,
  onAdd,
  count,
  total,
  onContinue,
}: {
  t: TFn;
  locale: Locale;
  mode: Mode;
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
          {mode === "custom"
            ? t(
                "Ajoutez chaque boîte — vous personnaliserez ensuite.",
                "أضف كل علبة — ستخصّصها لاحقًا.",
                "Add each box — you'll personalize them next."
              )
            : t("Ajoutez-en autant que vous voulez.", "أضف ما شئت منها.", "Add as many as you like.")}
        </p>
      </div>

      {/* Size tabs */}
      <div className="mt-3 flex shrink-0 gap-2 overflow-x-auto px-5 pb-1">
        {TIRAMISU_CATALOG.map((c) => {
          const active = c.id === activeCat;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                active ? "border-rose bg-rose text-white shadow-cake" : "border-border bg-white text-charcoal-light"
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
              <div className="relative aspect-square w-full bg-[#F6ECE0]">
                <Image src={o.image} alt={o.shapeLabel[locale]} fill sizes="260px" className="object-cover" />
                <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-charcoal shadow">
                  {o.shapeLabel[locale]}
                </span>
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
        <PrimaryButton onClick={onContinue} disabled={count === 0}>
          <ShoppingBag size={18} />
          {count === 0
            ? t("Ajoutez une boîte", "أضف علبة", "Add a box")
            : `${t("Voir le panier", "عرض السلة", "View bucket")} · ${count} · ${formatDA(total)}`}
          {count > 0 && <ArrowRight size={16} className="rtl:rotate-180" />}
        </PrimaryButton>
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
  onClearPersonalization,
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
  onClearPersonalization: (uid: string) => void;
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
              ? t("Personnalisez chaque boîte, ou laissez-la simple.", "خصّص كل علبة أو اتركها بسيطة.", "Personalize each box, or leave it plain.")
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
          const canCustomize = mode === "custom" && option.customizable;
          return (
            <div key={b.uid} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex gap-3 p-2.5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F6ECE0]">
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
                  {/* qty only in simple mode (custom = one unit per box) */}
                  {mode === "simple" && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <button onClick={() => setQty(b.uid, -1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-charcoal hover:border-rose hover:text-rose" aria-label="-">
                        <Minus size={13} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold tabular-nums">{b.qty}</span>
                      <button onClick={() => setQty(b.uid, 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-charcoal hover:border-rose hover:text-rose" aria-label="+">
                        <Plus size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Prominent, discoverable customization zone (custom mode) */}
              {canCustomize && (
                <div className="border-t border-border/70 px-2.5 py-2.5">
                  {b.personalization && ptext ? (
                    <div className="flex items-center gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-rose/[0.06] px-3 py-2">
                        <span className="text-base">{STYLE_META[b.personalization.style].emoji}</span>
                        <span className="truncate font-playfair text-sm font-semibold text-charcoal">
                          “{ptext.replace(/\n/g, " · ")}”
                        </span>
                      </div>
                      <button
                        onClick={() => onPersonalize(b.uid)}
                        className="shrink-0 rounded-full bg-rose/10 px-3 py-2 text-xs font-semibold text-rose hover:bg-rose/15"
                      >
                        {t("Modifier", "تعديل", "Edit")}
                      </button>
                      <button
                        onClick={() => onClearPersonalization(b.uid)}
                        className="shrink-0 rounded-full p-2 text-charcoal-lighter hover:text-charcoal"
                        aria-label={t("Retirer", "إزالة", "Remove")}
                        title={t("Laisser simple", "اتركها بسيطة", "Leave plain")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onPersonalize(b.uid)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-rose/50 bg-rose/[0.04] py-2.5 text-sm font-semibold text-rose transition-colors hover:bg-rose/10"
                    >
                      <WandSparkles size={16} />
                      {t("Personnaliser ce tiramisu", "خصّص هذا التيراميسو", "Personalize this tiramisu")}
                    </button>
                  )}
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
        <PrimaryButton onClick={onContinue} disabled={bucket.length === 0}>
          {t("Continuer", "متابعة", "Continue")}
          <ArrowRight size={16} className="rtl:rotate-180" />
        </PrimaryButton>
      </FooterBar>
    </div>
  );
}

// ============ Gate: soft personalize invitation ============
function GateModal({
  t,
  locale,
  mode,
  plainUnits,
  onClose,
  onUpgrade,
  onPersonalize,
  onSkip,
}: {
  t: TFn;
  locale: Locale;
  mode: Mode;
  plainUnits: BucketItem[];
  onClose: () => void;
  onUpgrade: () => void;
  onPersonalize: (uid: string) => void;
  onSkip: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-30 flex items-end justify-center sm:items-center"
    >
      <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="relative w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-charcoal/10 sm:hidden" />
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose/10 text-rose">
            <WandSparkles size={26} />
          </div>
          <h3 className="mt-3 font-playfair text-xl font-bold text-charcoal">
            {t("Envie de personnaliser ?", "هل ترغب في التخصيص؟", "Add a personal touch?")}
          </h3>
          <p className="mt-1 max-w-xs text-sm text-charcoal-light">
            {mode === "simple"
              ? t(
                  "Écrivez un prénom, un âge ou un petit mot sur vos tiramisus — gratuitement.",
                  "اكتب اسمًا أو عمرًا أو كلمة على تيراميسوك — مجانًا.",
                  "Write a name, an age or a little note on your tiramisus — for free."
                )
              : t(
                  `Il reste ${plainUnits.length} boîte(s) sans message. Touchez-en une pour l'écrire.`,
                  `بقيت ${plainUnits.length} علبة بلا رسالة. اضغط عليها لكتابتها.`,
                  `${plainUnits.length} box(es) still have no message. Tap one to write it.`
                )}
          </p>
        </div>

        {/* Custom mode: list the plain boxes for quick access */}
        {mode === "custom" && (
          <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
            {plainUnits.map((b) => {
              const f = findOption(b.optionId);
              if (!f) return null;
              return (
                <button
                  key={b.uid}
                  onClick={() => onPersonalize(b.uid)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-white p-2 text-start transition-colors hover:border-rose/50"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#F6ECE0]">
                    <Image src={f.option.image} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-charcoal">
                    {f.category.labels[locale]} · {f.option.shapeLabel[locale]}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose px-3 py-1.5 text-xs font-semibold text-white">
                    <Pencil size={12} /> {t("Écrire", "اكتب", "Write")}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {mode === "simple" && (
            <button
              onClick={onUpgrade}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-rose to-[#B05161] py-3.5 font-semibold text-white shadow-cake transition-all hover:shadow-cake-hover active:scale-[0.99]"
            >
              <WandSparkles size={18} />
              {t("Oui, je personnalise", "نعم، أريد التخصيص", "Yes, personalize")}
            </button>
          )}
          <button
            onClick={onSkip}
            className="w-full rounded-full py-3 text-sm font-medium text-charcoal-light transition-colors hover:text-charcoal"
          >
            {t("Non merci, continuer", "لا شكرًا، تابع", "No thanks, continue")}
          </button>
        </div>
      </motion.div>
    </motion.div>
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
        <PrimaryButton onClick={onConfirm}>
          <Check size={18} />
          {t("Confirmer la commande", "تأكيد الطلب", "Confirm order")}
        </PrimaryButton>
      </FooterBar>
    </div>
  );
}

// ============ Step: Confirm ============
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
          {t("Pour confirmer votre commande avec vous.", "لتأكيد طلبك معك.", "So we can confirm your order with you.")}
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

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </div>

      <FooterBar>
        <PrimaryButton onClick={onSubmit} disabled={!canSubmit}>
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
        </PrimaryButton>
      </FooterBar>
    </div>
  );
}
