"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TIRAMISU_CATALOG, formatDA, findOption } from "@/lib/tiramisu-catalog";
import { STYLE_META, type Locale, type TiramisuStyle } from "@/lib/tiramisu-config";
import type { TiramisuSizeId } from "@/lib/tiramisu-templates";
import { LocaleLink } from "@/i18n/LocaleLink";
import { switchLocaleHref } from "@/i18n/paths";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { EcrinSurface } from "@/components/ui/EcrinSurface";
import { CrownMark, Wordmark } from "@/components/ui/Wordmark";
import ItemCustomizer, { personalizationText, type Personalization } from "./ItemCustomizer";
import { LettersLand } from "./LettersLand";
import { TIcon, Spinner } from "./TiramisuIcon";
import { TiramisuUiProvider, useTiramisuUi, fmt, plural, type TiramisuUi } from "./ui-context";
import s from "./tiramisu.module.css";

type Step = "mode" | "boxes" | "bucket" | "review" | "confirm";
type Mode = "simple" | "custom";
const STEP_ORDER: Step[] = ["mode", "boxes", "bucket", "review", "confirm"];

// One cart line = a group of identical boxes. Some of its `qty` units may carry
// a personalization; the rest are plain. So "2 ovals, 1 written" = one line,
// qty 2, personalizations.length 1.
interface CartLine {
  uid: string;
  optionId: string;
  qty: number;
  personalizations: Personalization[]; // length 0..qty
}

const plainOf = (l: CartLine) => l.qty - l.personalizations.length;

// Display only: Dela draws U+202F (fr-FR digit grouping) as a wide gap, so
// prices on screen use a regular no-break space.
const money = (n: number) => formatDA(n).replace(/\u202f/g, "\u00a0");

// A guided personalization session (the loop): either edit one unit, or add
// several in a row, walking through them one by one.
type Session =
  | { lineUid: string; kind: "edit"; index: number }
  | { lineUid: string; kind: "add"; total: number; doneInSession: number };

/** Strings come from the server page (messages/<locale>/tiramisuUi.json). */
export default function TiramisuWizard({ locale, ui }: { locale: Locale; ui: TiramisuUi }) {
  return (
    <TiramisuUiProvider locale={locale} ui={ui}>
      <Wizard />
    </TiramisuUiProvider>
  );
}

function Wizard() {
  const { locale, ui } = useTiramisuUi();
  // Order message words for the shop: tiramisuUi.order_message. Keep those
  // strings byte-identical (the admin reads them); they are not UI copy.
  const om = ui.order_message;

  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<Mode>("custom");
  const [bucket, setBucket] = useState<CartLine[]>([]);
  const [activeCat, setActiveCat] = useState(TIRAMISU_CATALOG[0].id);

  const [gateOpen, setGateOpen] = useState(false);
  const [howMany, setHowMany] = useState<{ lineUid: string; max: number } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [custKey, setCustKey] = useState(0); // remounts the customizer between units

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  // Honeypot (POST /api/orders rejects a non-empty `website`): people never see it.
  const [website, setWebsite] = useState("");
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
  const plainLines = useMemo(() => bucket.filter((l) => plainOf(l) > 0), [bucket]);
  const lineOf = (uid: string) => bucket.find((l) => l.uid === uid) ?? null;

  // ---- bucket ops ----
  function addToBucket(optionId: string) {
    setBucket((prev) => {
      const ex = prev.find((b) => b.optionId === optionId);
      if (ex) return prev.map((b) => (b === ex ? { ...b, qty: b.qty + 1 } : b));
      return [...prev, { uid: newUid(), optionId, qty: 1, personalizations: [] }];
    });
  }
  function setQty(uid: string, delta: number) {
    setBucket((prev) =>
      prev.map((b) => {
        if (b.uid !== uid) return b;
        const qty = Math.max(1, b.qty + delta);
        // can't have more messages than boxes — drop extras when shrinking
        const personalizations = b.personalizations.slice(0, qty);
        return { ...b, qty, personalizations };
      })
    );
  }
  function removeLine(uid: string) {
    setBucket((prev) => prev.filter((b) => b.uid !== uid));
  }
  function removePersonalizationAt(lineUid: string, index: number) {
    setBucket((prev) =>
      prev.map((b) =>
        b.uid === lineUid
          ? { ...b, personalizations: b.personalizations.filter((_, i) => i !== index) }
          : b
      )
    );
  }

  // ---- personalization session (the loop) ----
  function startPersonalize(lineUid: string) {
    const line = lineOf(lineUid);
    if (!line) return;
    const plain = plainOf(line);
    if (plain <= 0) return;
    if (plain === 1) beginAdd(lineUid, 1);
    else setHowMany({ lineUid, max: plain });
  }
  function beginAdd(lineUid: string, total: number) {
    setHowMany(null);
    setGateOpen(false);
    setSession({ lineUid, kind: "add", total, doneInSession: 0 });
    setCustKey((k) => k + 1);
  }
  function editPersonalization(lineUid: string, index: number) {
    setSession({ lineUid, kind: "edit", index });
    setCustKey((k) => k + 1);
  }
  function onCustomizerSave(p: Personalization) {
    const s = session;
    if (!s) return;
    setBucket((prev) =>
      prev.map((l) => {
        if (l.uid !== s.lineUid) return l;
        if (s.kind === "edit") {
          const arr = [...l.personalizations];
          arr[s.index] = p;
          return { ...l, personalizations: arr };
        }
        return { ...l, personalizations: [...l.personalizations, p] };
      })
    );
    if (s.kind === "add" && s.doneInSession + 1 < s.total) {
      setSession({ ...s, doneInSession: s.doneInSession + 1 });
      setCustKey((k) => k + 1);
    } else {
      setSession(null);
    }
  }

  function upgradeToCustom() {
    setMode("custom");
    setGateOpen(false);
  }
  function onCartContinue() {
    if (plainLines.length > 0) setGateOpen(true);
    else setStep("review");
  }

  // ---- order message (sent to the shop; unchanged) ----
  function buildOrder() {
    const head = om.head;
    const modeLabel = mode === "custom" ? om.custom : om.simple;
    const rows: string[] = [`${head} — ${modeLabel}`, ""];
    bucket.forEach((b) => {
      const f = findOption(b.optionId);
      if (!f) return;
      const label = `${f.category.labels[locale]} · ${f.option.shapeLabel[locale]}`;
      rows.push(
        b.qty > 1
          ? `• ${b.qty}× ${label} — ${formatDA(f.option.price)} = ${formatDA(f.option.price * b.qty)}`
          : `• 1× ${label} — ${formatDA(f.option.price)}`
      );
      b.personalizations.forEach((p) => {
        const txt = personalizationText(p).replace(/\n/g, " / ");
        if (txt) rows.push(`   ✍️ ${STYLE_META[p.style].labels[locale]}: "${txt}"`);
      });
      const plain = plainOf(b);
      if (b.personalizations.length > 0 && plain > 0) {
        rows.push(`   • ${plain} ${om.plain}`);
      }
    });
    rows.push("", `${om.total}: ${formatDA(total)}`);
    return {
      message: rows.join("\n"),
      cakeTitle: `${om.tiramisu} — ${count} ${om.items}`,
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
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), message, cakeTitle, website }),
      });
      if (!res.ok) throw new Error("bad status");
      const data = (await res.json()) as { id?: string };
      setDoneId(data.id ?? "ok");
    } catch {
      setError(ui.confirm.error);
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
    setSession(null);
    setStep("mode");
  }
  function goBack() {
    const i = STEP_ORDER.indexOf(step);
    if (i > 0) setStep(STEP_ORDER[i - 1]);
  }

  // session-derived
  const sessionLine = session ? lineOf(session.lineUid) : null;
  const sessionOpt = sessionLine ? findOption(sessionLine.optionId) : null;
  const sessionInitial =
    session?.kind === "edit" ? sessionLine?.personalizations[session.index] ?? null : null;
  const sessionProgress =
    session?.kind === "add" && session.total > 1
      ? fmt(ui.custom.progress, { n: session.doneInSession + 1, total: session.total })
      : undefined;

  const stepIndex = STEP_ORDER.indexOf(step);
  const qtyOf = (optionId: string) => bucket.find((b) => b.optionId === optionId)?.qty ?? 0;

  // ============ SUCCESS ============
  if (doneId) {
    return (
      <Shell>
        <div className={cn(s.stepIn, "mx-auto flex h-full w-full max-w-[480px] flex-col items-center justify-center px-6 text-center")}>
          <CrownMark className={cn(s.pop, "size-20")} />
          <h1 className="type-h2 mt-6">{ui.success.title}</h1>
          <p className="type-lead mt-3 text-center">{ui.success.body}</p>
          <p className="type-meta mt-5 rounded-pill bg-dragee px-4 py-2 font-medium">
            {fmt(ui.review.label, { label: ui.success.ref })}{" "}
            <bdi className="ltr font-semibold">{doneId.slice(0, 8).toUpperCase()}</bdi>
          </p>
          <div className="mt-8 flex w-full flex-col gap-3">
            <Button onClick={reset} block>
              {ui.success.again}
            </Button>
            <Button href="/" variant="ghost" block>
              {ui.success.home}
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <TopBar step={step} stepIndex={stepIndex} onBack={goBack} />

      {/* Content */}
      <main id="main" className="relative flex min-h-0 flex-1 flex-col">
        <div
          key={step}
          className={cn(
            s.stepIn,
            "mx-auto flex h-full w-full max-w-[560px] flex-col",
            (step === "boxes" || step === "mode") && "desk:max-w-[1040px]"
          )}
        >
          {step === "mode" && (
            <ModeStep
              onPick={(m) => {
                setMode(m);
                setStep("boxes");
              }}
            />
          )}
          {step === "boxes" && (
            <BoxesStep
              mode={mode}
              activeCat={activeCat}
              setActiveCat={setActiveCat}
              onAdd={addToBucket}
              qtyOf={qtyOf}
              count={count}
              total={total}
              onContinue={() => setStep("bucket")}
            />
          )}
          {step === "bucket" && (
            <BucketStep
              bucket={bucket}
              mode={mode}
              total={total}
              setQty={setQty}
              removeLine={removeLine}
              onStartPersonalize={startPersonalize}
              onEditPersonalization={editPersonalization}
              onRemovePersonalization={removePersonalizationAt}
              onAddMore={() => setStep("boxes")}
              onContinue={onCartContinue}
            />
          )}
          {step === "review" && (
            <ReviewStep bucket={bucket} total={total} onConfirm={() => setStep("confirm")} />
          )}
          {step === "confirm" && (
            <ConfirmStep
              name={name}
              phone={phone}
              setName={setName}
              setPhone={setPhone}
              website={website}
              setWebsite={setWebsite}
              total={total}
              count={count}
              canSubmit={canSubmit}
              submitting={submitting}
              error={error}
              onSubmit={submit}
            />
          )}
        </div>

        {/* How-many chooser */}
        {howMany && (
          <HowManyModal
            info={howMany}
            onClose={() => setHowMany(null)}
            onConfirm={(k) => beginAdd(howMany.lineUid, k)}
          />
        )}

        {/* Personalize gate (soft invitation on Continue) */}
        {gateOpen && (
          <GateModal
            mode={mode}
            plainLines={plainLines}
            onClose={() => setGateOpen(false)}
            onUpgrade={upgradeToCustom}
            onPersonalize={(uid) => startPersonalize(uid)}
            onSkip={() => {
              setGateOpen(false);
              setStep("review");
            }}
          />
        )}

        {/* Customizer overlay (the loop) */}
        {session && sessionLine && sessionOpt && (
          // Covers the top bar too: a focused task whose exits are Cancel / Save.
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${ui.custom.personalizing} ${sessionOpt.category.labels[locale]} · ${sessionOpt.option.shapeLabel[locale]}`}
            className={cn(s.overlayIn, "fixed inset-0 z-40 flex flex-col bg-sucre pt-3")}
          >
            <div className="mx-auto flex h-full w-full max-w-[560px] flex-col">
              <ItemCustomizer
                key={custKey}
                initial={sessionInitial}
                optionLabel={`${sessionOpt.category.labels[locale]} · ${sessionOpt.option.shapeLabel[locale]}`}
                shape={sessionOpt.option.shape}
                sizeId={sessionOpt.category.id as TiramisuSizeId}
                progressLabel={sessionProgress}
                onSave={onCustomizerSave}
                onCancel={() => setSession(null)}
              />
            </div>
          </div>
        )}
      </main>
    </Shell>
  );
}

// ============ Shell / chrome ============
function Shell({ children }: { children: React.ReactNode }) {
  // Full-screen, no page scroll: each step scrolls inside itself if needed.
  return <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-sucre text-paillette">{children}</div>;
}

const LOCALES = ["fr", "ar", "en"] as const;
const LANG_SHORT = { fr: "FR", ar: "ع", en: "EN" } as const;

/**
 * FR / ع / EN, as on the site header. Plain <a href> full navigations: a
 * locale switch changes <html lang/dir> and must set the locale cookie, which
 * a soft (RSC) navigation doesn't do.
 */
function LanguageCircles() {
  const { ui, locale } = useTiramisuUi();
  const names = { fr: ui.chrome.lang_fr, ar: ui.chrome.lang_ar, en: ui.chrome.lang_en };
  return (
    <nav aria-label={ui.chrome.lang_label} className="flex items-center">
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <a
            key={l}
            href={switchLocaleHref(l, "/tiramisu")}
            lang={l}
            hrefLang={l}
            aria-label={names[l]}
            aria-current={active ? "true" : undefined}
            className="group grid size-11 place-items-center rounded-full no-underline"
          >
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full text-[13px] leading-none font-medium",
                active ? "bg-paillette text-sucre" : "text-paillette group-hover:bg-dragee",
                // System font for the lone "ع" (no Arabic font slice on FR/EN).
                l === "ar" && "pb-0.5 font-[system-ui,sans-serif] text-[15px]"
              )}
            >
              {LANG_SHORT[l]}
            </span>
          </a>
        );
      })}
    </nav>
  );
}

/** The WhatsApp way out, on every step (same brief kind as the home band). */
function WhatsAppShortcut() {
  const { ui, locale } = useTiramisuUi();
  const href = useMemo(() => buildWhatsAppUrl({ locale, kind: "tiramisu", page: "/tiramisu" }), [locale]);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ui.chrome.whatsapp}
      className="press grid size-11 shrink-0 place-items-center rounded-full bg-dragee text-framboise hover:bg-[#f0c6d6]"
    >
      <Icon name="whatsapp" size={22} />
    </a>
  );
}

function TopBar({ step, stepIndex, onBack }: { step: Step; stepIndex: number; onBack: () => void }) {
  const { ui } = useTiramisuUi();
  if (step === "mode") {
    // Same maison as the site: wordmark home link, languages, WhatsApp.
    return (
      <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-2 px-4 desk:px-8">
        <span className="sr-only">{fmt(ui.chrome.progress, { n: stepIndex + 1, total: STEP_ORDER.length })}</span>
        <LocaleLink
          href="/"
          prefetch={false}
          aria-label={ui.chrome.home}
          className="-ms-1 inline-flex min-h-11 min-w-0 items-center rounded-pill px-1"
        >
          <Wordmark layout="stacked" className="desk:hidden" />
          <Wordmark layout="inline" className="hidden desk:inline-flex" />
        </LocaleLink>
        <div className="flex items-center gap-1">
          <LanguageCircles />
          <WhatsAppShortcut />
        </div>
      </header>
    );
  }
  return (
    <header className="relative z-20 grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 desk:px-8">
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onBack}
          className="press -ms-1 inline-flex min-h-11 items-center gap-1.5 rounded-pill pe-4 ps-3 text-[15px] font-medium shadow-[inset_0_0_0_1.5px_var(--color-hairline)] hover:shadow-[inset_0_0_0_1.5px_var(--color-paillette)]"
        >
          <Icon name="back" size={20} />
          {ui.chrome.back}
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="sr-only">{fmt(ui.chrome.progress, { n: stepIndex + 1, total: STEP_ORDER.length })}</span>
        {STEP_ORDER.map((st, i) => (
          <span
            key={st}
            aria-hidden="true"
            className={cn(
              "h-1.5 rounded-pill transition-[width,background-color] duration-300",
              i === stepIndex ? "w-6 bg-framboise" : i < stepIndex ? "w-1.5 bg-paillette" : "w-1.5 bg-paillette/15"
            )}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <WhatsAppShortcut />
      </div>
    </header>
  );
}

function FooterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 shrink-0 bg-sucre px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-1px_0_var(--color-hairline)] desk:px-6 desk:pb-6 desk:shadow-none">
      <div className="mx-auto w-full desk:max-w-[512px]">{children}</div>
    </div>
  );
}

function StepHead({ title, lead, action }: { title: string; lead?: string; action?: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-1 desk:px-6">
      <div className="min-w-0">
        <h1 className="type-band">{title}</h1>
        {lead && <p className="type-meta mt-1 text-ink-muted">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

/** Cocoa vs white-chocolate swatch (replaces the old emoji). */
function StyleDot({ style, className }: { style: TiramisuStyle; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-3 shrink-0 rounded-full",
        style === "cacao" ? "bg-cacao" : "bg-white shadow-[inset_0_0_0_1.5px_var(--color-cacao)]",
        className
      )}
    />
  );
}

// ============ Step: Mode ============
function ModeStep({ onPick }: { onPick: (m: Mode) => void }) {
  const { ui } = useTiramisuUi();
  const cards: { mode: Mode; title: string; desc: string; img: string; featured: boolean }[] = [
    { mode: "custom", title: ui.mode.custom_title, desc: ui.mode.custom_desc, img: "/images/tiramisu/hero/hero-1.png", featured: true },
    { mode: "simple", title: ui.mode.simple_title, desc: ui.mode.simple_desc, img: "/images/tiramisu/boxes/box-square.png", featured: false },
  ];
  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto px-4 pb-4 desk:grid desk:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] desk:content-center desk:items-center desk:gap-x-14 desk:px-6 desk:pb-8">
      {/* The stage (écrin) + the page's one signature moment: a slim band on
          phones (the choice must sit in the first viewport), a tile on desktop. */}
      <EcrinSurface className="flex h-[clamp(160px,34dvh,300px)] shrink-0 items-center justify-center rounded-[28px] p-3.5 desk:row-span-3 desk:aspect-square desk:h-auto desk:max-h-[520px] desk:rounded-[32px] desk:p-8">
        <LettersLand
          word={ui.mode.sample}
          label={fmt(ui.mode.stage_label, { word: ui.mode.sample })}
          priority
          className="h-full w-auto max-w-full desk:h-auto desk:w-full"
        />
      </EcrinSurface>

      <div className="shrink-0">
        <h1 className="type-h2">{ui.mode.title}</h1>
        <p className="type-lead mt-2">{ui.mode.lead}</p>
      </div>

      <div className="grid shrink-0 gap-3">
        {cards.map((c) => (
          <button
            key={c.mode}
            type="button"
            onClick={() => onPick(c.mode)}
            className={cn(
              "press group flex min-h-[84px] items-center gap-4 rounded-[24px] p-2.5 pe-4 text-start",
              c.featured
                ? "bg-dragee"
                : "bg-white shadow-[inset_0_0_0_1.5px_var(--color-hairline)] hover:shadow-[inset_0_0_0_1.5px_var(--color-paillette)]"
            )}
          >
            <span className="relative size-16 shrink-0 overflow-hidden rounded-[18px] bg-mascarpone">
              <Image src={c.img} alt="" fill sizes="64px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[19px] leading-tight [&:lang(ar)]:text-[22px]">{c.title}</span>
              <span className="type-meta mt-0.5 block text-ink-muted">{c.desc}</span>
            </span>
            <Icon name="chevron" size={22} className={c.featured ? "text-framboise" : "text-paillette"} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ Step: Boxes ============
function BoxesStep({
  mode, activeCat, setActiveCat, onAdd, qtyOf, count, total, onContinue,
}: {
  mode: Mode; activeCat: string; setActiveCat: (id: string) => void;
  onAdd: (optionId: string) => void; qtyOf: (optionId: string) => number;
  count: number; total: number; onContinue: () => void;
}) {
  const { ui, locale } = useTiramisuUi();
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const sectionId = (id: string) => `${baseId}-size-${id}`;

  // Every size is listed (one list, no lonely card); the chips jump to a size
  // and follow the scroll, so `activeCat` always names the size in view.
  useEffect(() => {
    const root = listRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const id = top?.target.getAttribute("data-size");
        if (id) setActiveCat(id);
      },
      { root, rootMargin: "0px 0px -60% 0px" }
    );
    root.querySelectorAll("[data-size]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [setActiveCat]);

  const jumpTo = (id: string) => {
    setActiveCat(id);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(sectionId(id))?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="flex h-full flex-col">
      <StepHead title={ui.boxes.title} lead={mode === "custom" ? ui.boxes.lead_custom : ui.boxes.lead_simple} />

      <div role="group" aria-label={ui.boxes.sizes} className={cn(s.rail, "mt-4 flex shrink-0 snap-x gap-2 overflow-x-auto px-4 pb-1 desk:hidden")}>
        {TIRAMISU_CATALOG.map((c) => (
          <Chip key={c.id} selected={c.id === activeCat} onClick={() => jumpTo(c.id)} className="h-11">
            {c.labels[locale]}
            <span className="ms-1.5 font-normal opacity-70">{c.portions[locale]}</span>
          </Chip>
        ))}
      </div>

      {/* Phone: full-width rows grouped by size (the chips jump between sizes).
          Desktop: the three sizes side by side, everything in one view. */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-6 desk:grid desk:grid-cols-3 desk:content-start desk:gap-6 desk:px-6 desk:pt-6">
        {TIRAMISU_CATALOG.map((category) => (
          <section key={category.id} id={sectionId(category.id)} data-size={category.id} aria-labelledby={`${sectionId(category.id)}-h`} className="scroll-mt-2 pt-4 desk:pt-0">
            <h2 id={`${sectionId(category.id)}-h`} className="mb-2.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[15px] font-semibold">{category.labels[locale]}</span>
              <span className="type-meta text-ink-muted">{category.portions[locale]}</span>
            </h2>
            <ul className="grid gap-3">
              {category.options.map((o) => {
                const n = qtyOf(o.id);
                return (
                  <li key={o.id} className="grid grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-[24px] bg-white shadow-[inset_0_0_0_1.5px_var(--color-hairline)]">
                    <div className="relative aspect-square w-full bg-mascarpone">
                      <Image src={o.image} alt="" fill sizes="112px" className="object-cover" />
                      {n > 0 && (
                        <span key={n} className={cn(s.pop, "type-meta absolute start-2 top-2 rounded-pill bg-paillette px-2.5 py-1 text-xs font-medium text-sucre")}>
                          {fmt(ui.boxes.in_bucket, { n })}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col justify-between gap-3 p-3.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 desk:flex-col desk:items-start">
                        <h3 className="type-card">{o.shapeLabel[locale]}</h3>
                        <span className="ltr text-[15px] font-semibold">{money(o.price)}</span>
                      </div>
                      <Button
                        size="sm"
                        block
                        onClick={() => onAdd(o.id)}
                        aria-label={fmt(ui.boxes.add_aria, { box: `${category.labels[locale]} · ${o.shapeLabel[locale]}` })}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <TIcon name="plus" size={18} />
                          {ui.boxes.add}
                        </span>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <FooterBar>
        <Button block onClick={onContinue} disabled={count === 0} aria-live="polite">
          {count === 0 ? (
            ui.boxes.cta_empty
          ) : (
            <span className="inline-flex items-center gap-2">
              {ui.boxes.cta}
              <span className="font-normal opacity-85">
                · <bdi className="ltr">{fmt(ui.boxes.cta_count, { n: count, total: money(total) })}</bdi>
              </span>
              <Icon name="arrow" size={18} />
            </span>
          )}
        </Button>
      </FooterBar>
    </div>
  );
}

// ============ Step: Bucket (grouped lines, collapse/expand) ============
function BucketStep({
  bucket, mode, total, setQty, removeLine,
  onStartPersonalize, onEditPersonalization, onRemovePersonalization, onAddMore, onContinue,
}: {
  bucket: CartLine[]; mode: Mode; total: number;
  setQty: (uid: string, d: number) => void; removeLine: (uid: string) => void;
  onStartPersonalize: (uid: string) => void;
  onEditPersonalization: (uid: string, index: number) => void;
  onRemovePersonalization: (uid: string, index: number) => void;
  onAddMore: () => void; onContinue: () => void;
}) {
  const { ui, locale } = useTiramisuUi();
  const [expanded, setExpanded] = useState<string | null>(null);
  const baseId = useId();

  return (
    <div className="flex h-full flex-col">
      <StepHead
        title={ui.bucket.title}
        lead={mode === "custom" ? ui.bucket.lead_custom : ui.bucket.lead_simple}
        action={
          <button
            type="button"
            onClick={onAddMore}
            aria-label={ui.bucket.add_more}
            className="press inline-flex size-11 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1.5px_var(--color-hairline)] hover:shadow-[inset_0_0_0_1.5px_var(--color-paillette)]"
          >
            <TIcon name="plus" size={20} />
          </button>
        }
      />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 desk:px-6">
        {bucket.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-ink-muted">
            <TIcon name="bag" size={32} />
            <p>{ui.bucket.empty}</p>
          </div>
        )}
        {bucket.map((b) => {
          const f = findOption(b.optionId);
          if (!f) return null;
          const { category, option } = f;
          const boxName = `${category.labels[locale]} · ${option.shapeLabel[locale]}`;
          const nCustom = b.personalizations.length;
          const plain = plainOf(b);
          const isOpen = expanded === b.uid;
          const panelId = `${baseId}-${b.uid}`;
          const summary =
            nCustom === 0
              ? null
              : [
                  plural(nCustom, ui.bucket.custom_one, ui.bucket.custom_other),
                  plain > 0 ? plural(plain, ui.bucket.plain_one, ui.bucket.plain_other) : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

          return (
            <section key={b.uid} aria-label={boxName} className="overflow-hidden rounded-[22px] bg-white shadow-[inset_0_0_0_1.5px_var(--color-hairline)]">
              {/* main row */}
              <div className="flex gap-3 p-3">
                <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[16px] bg-mascarpone">
                  <Image src={option.image} alt="" fill sizes="72px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 pt-0.5">
                      <h2 className="truncate text-[15px] font-semibold leading-snug">{boxName}</h2>
                      <p className="type-meta text-ink-muted">
                        <bdi className="ltr">{b.qty > 1 ? `${b.qty} × ${money(option.price)}` : money(option.price)}</bdi>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(b.uid)}
                      aria-label={fmt(ui.bucket.remove, { box: boxName })}
                      className="press -me-1.5 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:text-framboise"
                    >
                      <TIcon name="trash" size={19} />
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <QtyButton label={ui.bucket.less} onClick={() => setQty(b.uid, -1)} disabled={b.qty <= 1} icon="minus" />
                    <span className="w-7 text-center text-[17px] font-semibold tabular-nums" aria-live="polite">
                      <span className="sr-only">{fmt(ui.bucket.qty, { n: b.qty })}</span>
                      <span aria-hidden="true">{b.qty}</span>
                    </span>
                    <QtyButton label={ui.bucket.more} onClick={() => setQty(b.uid, 1)} icon="plus" />
                    <span className="ms-auto text-[15px] font-semibold"><bdi className="ltr">{money(option.price * b.qty)}</bdi></span>
                  </div>
                </div>
              </div>

              {/* customization zone (custom mode) */}
              {mode === "custom" && (
                <div className="px-3 pb-3">
                  {nCustom === 0 ? (
                    <button
                      type="button"
                      onClick={() => onStartPersonalize(b.uid)}
                      className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-dragee px-4 text-[15px] font-semibold text-framboise hover:bg-[#f0c6d6]"
                    >
                      <TIcon name="pencil" size={18} />
                      {b.qty > 1 ? fmt(ui.bucket.personalize_n, { n: plain }) : ui.bucket.personalize_one}
                    </button>
                  ) : (
                    <div className="rounded-[16px] bg-sucre">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : b.uid)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="flex min-h-12 w-full items-center justify-between gap-2 rounded-[16px] px-3.5 text-start"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <TIcon name="pencil" size={16} className="text-framboise" />
                          {summary}
                        </span>
                        <TIcon name="down" size={18} className={cn("text-ink-muted transition-transform duration-200", isOpen && "rotate-180")} />
                      </button>

                      {isOpen && (
                        <ul id={panelId} className={cn(s.stepIn, "space-y-1 px-2 pb-2")}>
                          {b.personalizations.map((p, i) => {
                            const msg = personalizationText(p).replace(/\n/g, " · ") || "…";
                            return (
                              <li key={i} className="flex items-center gap-2 rounded-[12px] bg-white ps-3">
                                <StyleDot style={p.style} />
                                <span className="ltr min-w-0 flex-1 truncate text-start font-display text-[15px] uppercase tracking-[0.04em]" title={STYLE_META[p.style].labels[locale]}>
                                  {msg}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onEditPersonalization(b.uid, i)}
                                  className="inline-flex min-h-11 shrink-0 items-center rounded-pill px-3 text-sm font-semibold text-framboise hover:underline"
                                >
                                  {ui.bucket.edit}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRemovePersonalization(b.uid, i)}
                                  aria-label={fmt(ui.bucket.remove_message, { msg })}
                                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:text-framboise"
                                >
                                  <TIcon name="trash" size={17} />
                                </button>
                              </li>
                            );
                          })}
                          {plain > 0 && (
                            <li className="flex items-center justify-between gap-2 ps-3">
                              <span className="type-meta text-ink-muted">{fmt(ui.bucket.plain_count, { n: plain })}</span>
                              <button
                                type="button"
                                onClick={() => onStartPersonalize(b.uid)}
                                className="press inline-flex min-h-11 items-center gap-1.5 rounded-pill bg-dragee px-4 text-sm font-semibold text-framboise hover:bg-[#f0c6d6]"
                              >
                                <TIcon name="plus" size={16} />
                                {ui.bucket.personalize}
                              </button>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <FooterBar>
        <TotalRow label={ui.bucket.total} total={total} />
        <Button block onClick={onContinue} disabled={bucket.length === 0} iconEnd="arrow">
          {ui.bucket.continue}
        </Button>
      </FooterBar>
    </div>
  );
}

function QtyButton({ label, onClick, disabled, icon }: { label: string; onClick: () => void; disabled?: boolean; icon: "plus" | "minus" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="press inline-flex size-11 items-center justify-center rounded-full shadow-[inset_0_0_0_1.5px_var(--color-hairline)] hover:shadow-[inset_0_0_0_1.5px_var(--color-paillette)] disabled:opacity-40 disabled:hover:shadow-[inset_0_0_0_1.5px_var(--color-hairline)]"
    >
      <TIcon name={icon} size={18} />
    </button>
  );
}

function TotalRow({ label, total, accent }: { label: string; total: number; accent?: boolean }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <span className="text-[15px] text-ink-muted">{label}</span>
      <span className={cn("ltr font-display text-[22px] leading-none", accent && "text-framboise")}>{money(total)}</span>
    </div>
  );
}

// ============ Sheets ============
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/*
  Bottom sheet (modal). Focus moves in on open and back on close; Tab is
  trapped inside; everything else on the page is `inert` while it is open.
  `onClose` is read through a ref, so parents can pass an inline arrow without
  re-running the effect (which used to re-focus the panel on every render).
*/
function Sheet({ children, onClose, labelledBy }: { children: React.ReactNode; onClose: () => void; labelledBy: string }) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    // Make the rest of the page inert: every sibling along the path to <body>.
    const inerted: HTMLElement[] = [];
    for (let node: HTMLElement | null = root.current; node && node !== document.body; node = node.parentElement) {
      const parent: HTMLElement | null = node.parentElement;
      if (!parent) break;
      for (const sib of Array.from(parent.children)) {
        if (sib !== node && sib instanceof HTMLElement && !sib.inert) {
          sib.inert = true;
          inerted.push(sib);
        }
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      for (const el of inerted) el.inert = false;
      prev?.focus?.();
    };
  }, []);
  return (
    <div ref={root} className="fixed inset-0 z-50 flex items-end justify-center desk:items-center">
      <div className={cn(s.scrimIn, "absolute inset-0 bg-paillette/55")} onClick={() => onCloseRef.current()} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          s.sheetIn,
          "relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-sucre px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] outline-none desk:rounded-[32px] desk:pt-6"
        )}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-pill bg-paillette/15 desk:hidden" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

function HowManyModal({
  info, onClose, onConfirm,
}: {
  info: { lineUid: string; max: number }; onClose: () => void; onConfirm: (k: number) => void;
}) {
  const { ui } = useTiramisuUi();
  const titleId = useId();
  return (
    <Sheet onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="type-band">{ui.howmany.title}</h2>
      <p className="type-meta mt-2 text-ink-muted">{fmt(ui.howmany.body, { max: info.max })}</p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {Array.from({ length: info.max }, (_, i) => i + 1).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onConfirm(k)}
            className="press inline-flex size-14 items-center justify-center rounded-full bg-dragee font-display text-[22px] text-framboise hover:bg-framboise hover:text-white"
          >
            {k}
          </button>
        ))}
      </div>
      <Button onClick={onClose} variant="ghost" block className="mt-6">
        {ui.howmany.cancel}
      </Button>
    </Sheet>
  );
}

function GateModal({
  mode, plainLines, onClose, onUpgrade, onPersonalize, onSkip,
}: {
  mode: Mode; plainLines: CartLine[];
  onClose: () => void; onUpgrade: () => void; onPersonalize: (uid: string) => void; onSkip: () => void;
}) {
  const { ui, locale } = useTiramisuUi();
  const titleId = useId();
  return (
    <Sheet onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="type-band">{ui.gate.title}</h2>
      <p className="type-meta mt-2 text-ink-muted">{mode === "simple" ? ui.gate.body_simple : ui.gate.body_custom}</p>

      {mode === "custom" && (
        <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto">
          {plainLines.map((b) => {
            const f = findOption(b.optionId);
            if (!f) return null;
            const plain = plainOf(b);
            return (
              <li key={b.uid}>
                <button
                  type="button"
                  onClick={() => onPersonalize(b.uid)}
                  className="press flex w-full items-center gap-3 rounded-[20px] bg-white p-2 pe-3 text-start shadow-[inset_0_0_0_1.5px_var(--color-hairline)] hover:shadow-[inset_0_0_0_1.5px_var(--color-paillette)]"
                >
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-[14px] bg-mascarpone">
                    <Image src={f.option.image} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] font-medium">
                    {f.category.labels[locale]} · {f.option.shapeLabel[locale]}
                    {plain > 1 && <span className="block text-ink-muted type-meta">{fmt(ui.gate.plain_n, { n: plain })}</span>}
                  </span>
                  <span className="inline-flex min-h-9 items-center gap-1.5 rounded-pill bg-framboise px-3.5 text-sm font-semibold text-white">
                    <TIcon name="pencil" size={15} />
                    {ui.gate.write}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        {mode === "simple" && (
          <Button onClick={onUpgrade} block>
            <span className="inline-flex items-center gap-2">
              <TIcon name="pencil" size={19} />
              {ui.gate.yes}
            </span>
          </Button>
        )}
        <Button onClick={onSkip} variant="ghost" block>
          {ui.gate.skip}
        </Button>
      </div>
    </Sheet>
  );
}

// ============ Step: Review ============
function ReviewStep({ bucket, total, onConfirm }: { bucket: CartLine[]; total: number; onConfirm: () => void }) {
  const { ui, locale } = useTiramisuUi();
  return (
    <div className="flex h-full flex-col">
      <StepHead title={ui.review.title} lead={ui.review.lead} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 desk:px-6">
        {/* the ticket: scalloped bottom edge */}
        <div className={cn(s.scallop, "rounded-t-[24px] bg-white px-4 pt-2")}>
          <ul>
            {bucket.map((b) => {
              const f = findOption(b.optionId);
              if (!f) return null;
              const { category, option } = f;
              const plain = plainOf(b);
              return (
                <li key={b.uid} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="flex gap-1.5 text-[15px] font-semibold">
                      <bdi className="ltr shrink-0 text-framboise">{b.qty}×</bdi>
                      <span>{category.labels[locale]} · {option.shapeLabel[locale]}</span>
                    </p>
                    <span className="ltr shrink-0 text-[15px] font-semibold">{money(option.price * b.qty)}</span>
                  </div>
                  {b.personalizations.map((p, i) => (
                    <p key={i} className="type-meta mt-1.5 flex items-center gap-2 text-ink-soft">
                      <StyleDot style={p.style} />
                      <span className="shrink-0">{fmt(ui.review.label, { label: STYLE_META[p.style].labels[locale] })}</span>
                      <span className="ltr truncate font-display uppercase tracking-[0.04em]">
                        {personalizationText(p).replace(/\n/g, " · ") || "…"}
                      </span>
                    </p>
                  ))}
                  {b.personalizations.length > 0 && plain > 0 && (
                    <p className="type-meta mt-1.5 text-ink-muted">{fmt(ui.review.plain_more, { n: plain })}</p>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-1 mb-3 flex items-baseline justify-between gap-3 rounded-[16px] bg-sucre px-3 py-3.5">
            <span className="text-[15px] font-semibold">{ui.review.total}</span>
            <span className="ltr font-display text-[26px] leading-none text-framboise">{money(total)}</span>
          </div>
        </div>
      </div>

      <FooterBar>
        <Button block onClick={onConfirm}>
          <span className="inline-flex items-center gap-2">
            <Icon name="check" size={20} />
            {ui.review.confirm}
          </span>
        </Button>
      </FooterBar>
    </div>
  );
}

// ============ Step: Confirm ============
function ConfirmStep({
  name, phone, setName, setPhone, website, setWebsite, total, count, canSubmit, submitting, error, onSubmit,
}: {
  name: string; phone: string; setName: (v: string) => void; setPhone: (v: string) => void;
  website: string; setWebsite: (v: string) => void;
  total: number; count: number; canSubmit: boolean; submitting: boolean; error: string | null; onSubmit: () => void;
}) {
  const { ui } = useTiramisuUi();
  const nameId = useId();
  const phoneId = useId();
  const field =
    "h-14 w-full rounded-[18px] bg-white px-4 text-[17px] text-paillette shadow-[inset_0_0_0_1.5px_var(--color-hairline)] placeholder:text-ink-muted/70";
  return (
    <div className="flex h-full flex-col">
      <StepHead title={ui.confirm.title} lead={ui.confirm.lead} />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 desk:px-6">
        <div>
          <label htmlFor={nameId} className="mb-1.5 block text-sm font-medium text-ink-muted">{ui.confirm.name}</label>
          <input
            id={nameId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={ui.confirm.name_ph}
            autoComplete="name"
            className={field}
          />
        </div>
        <div>
          <label htmlFor={phoneId} className="mb-1.5 block text-sm font-medium text-ink-muted">{ui.confirm.phone}</label>
          <input
            id={phoneId}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="05 00 00 00 00"
            dir="ltr"
            className={cn(field, "text-start")}
          />
        </div>
        {/* Honeypot: clipped (sr-only), out of the tab order and the a11y tree. */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="sr-only"
        />

        <div className="rounded-[22px] bg-dragee p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-medium">{plural(count, ui.confirm.items_one, ui.confirm.items_other)}</span>
            <span className="ltr font-display text-[22px] leading-none">{money(total)}</span>
          </div>
          <p className="type-meta mt-2.5 flex items-start gap-2 text-ink-soft">
            <TIcon name="info" size={17} className="mt-px text-framboise" />
            {ui.confirm.no_payment}
          </p>
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-[16px] bg-white px-4 py-3 text-sm font-medium text-framboise shadow-[inset_0_0_0_1.5px_var(--color-framboise)]">
            <TIcon name="alert" size={18} className="mt-px" />
            {error}
          </p>
        )}
      </div>

      <FooterBar>
        <Button block onClick={onSubmit} disabled={!canSubmit} aria-busy={submitting}>
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size={20} />
              {ui.confirm.sending}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Icon name="check" size={20} />
              {ui.confirm.submit}
            </span>
          )}
        </Button>
      </FooterBar>
    </div>
  );
}
