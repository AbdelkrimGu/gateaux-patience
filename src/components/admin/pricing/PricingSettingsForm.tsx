"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import type { PricingSettings } from "@/lib/pricing-types";
import { formatDA, parseDecimal } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { apiJson, errorText, type ErrorInfo } from "./api";
import { numberError } from "./draft";
import { formatDate, numberToRaw } from "./format";
import { FormulaSteps } from "./PriceBreakdown";
import { ApiErrorBox, CARD_CLASS, DecimalInput, INPUT_CLASS, LABEL_CLASS, PRIMARY_BTN } from "./ui";

const ROUND_OPTIONS = [0, 10, 50, 100, 500, 1000];

interface Props {
  settings: PricingSettings;
  onSaved: (s: PricingSettings) => void;
}

export default function PricingSettingsForm({ settings, onSaved }: Props) {
  const [rateRaw, setRateRaw] = useState(numberToRaw(settings.hourlyRate));
  const [marginRaw, setMarginRaw] = useState(numberToRaw(settings.marginPercent));
  const [roundTo, setRoundTo] = useState(settings.roundTo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [saved, setSaved] = useState(false);

  // Reloaded from the server (changed on the laptop): follow it, unless she is
  // in the middle of typing other values here.
  const shown = useRef(settings);
  useEffect(() => {
    const prev = shown.current;
    shown.current = settings;
    const untouched =
      rateRaw === numberToRaw(prev.hourlyRate) && marginRaw === numberToRaw(prev.marginPercent) && roundTo === prev.roundTo;
    if (!untouched) return;
    setRateRaw(numberToRaw(settings.hourlyRate));
    setMarginRaw(numberToRaw(settings.marginPercent));
    setRoundTo(settings.roundTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(t);
  }, [saved]);

  const roundOptions = ROUND_OPTIONS.includes(roundTo) ? ROUND_OPTIONS : [...ROUND_OPTIONS, roundTo].sort((a, b) => a - b);

  async function submit() {
    // Same checks (and messages) as the calculator; each field also shows its own.
    const fail = (text: string) => setError({ text, conflict: false });
    const rateErr = numberError(rateRaw);
    const marginErr = numberError(marginRaw);
    if (rateErr) return fail(`Taux horaire : ${rateErr}.`);
    if (marginErr) return fail(`Marge : ${marginErr}.`);
    const hourlyRate = rateRaw.trim() === "" ? 0 : parseDecimal(rateRaw);
    const marginPercent = marginRaw.trim() === "" ? 0 : parseDecimal(marginRaw);
    if (hourlyRate === null || hourlyRate < 0) return fail("Indiquez un taux horaire valide (ex : 800).");
    if (marginPercent === null || marginPercent < 0) return fail("Indiquez une marge valide (ex : 30).");
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const next = await apiJson<PricingSettings>(
        "/api/admin/pricing/settings",
        "PUT",
        { hourlyRate, marginPercent, roundTo },
        "L'enregistrement des réglages a échoué."
      );
      setRateRaw(numberToRaw(next.hourlyRate));
      setMarginRaw(numberToRaw(next.marginPercent));
      setRoundTo(next.roundTo);
      onSaved(next);
      setSaved(true);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        className={cn(CARD_CLASS, "p-4 space-y-4")}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div>
          <h2 className="font-semibold text-gray-800">Réglages du calcul</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Ils s&apos;appliquent à vos nouveaux calculs et à toutes vos fiches prix, recalculées aussitôt. Un
            devis enregistré garde ses réglages ; à l&apos;ouverture, vous pourrez lui appliquer les nouveaux.
          </p>
        </div>

        <div>
          <label htmlFor="set-rate" className={LABEL_CLASS}>Taux horaire</label>
          <DecimalInput id="set-rate" value={rateRaw} onChange={setRateRaw} suffix="DA/h" placeholder="0" className="max-w-[12rem]" />
          <p className="text-xs text-gray-400 mt-1">Ce que vous voulez gagner pour 1 heure de travail.</p>
        </div>

        <div>
          <label htmlFor="set-margin" className={LABEL_CLASS}>Marge</label>
          <DecimalInput id="set-margin" value={marginRaw} onChange={setMarginRaw} suffix="%" placeholder="0" className="max-w-[12rem]" />
          <p className="text-xs text-gray-400 mt-1">Pourcentage ajouté au coût de revient (matières + main d&apos;œuvre).</p>
        </div>

        <div>
          <label htmlFor="set-round" className={LABEL_CLASS}>Arrondir le prix de vente au-dessus</label>
          <select
            id="set-round"
            value={roundTo}
            onChange={(e) => setRoundTo(Number(e.target.value))}
            className={cn(INPUT_CLASS, "max-w-[12rem]")}
          >
            {roundOptions.map((r) => (
              <option key={r} value={r}>
                {r === 0 ? "Pas d'arrondi" : `à ${formatDA(r)}`}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Ex : avec 100 DA, 4 520 DA devient 4 600 DA.</p>
        </div>

        {error && <ApiErrorBox error={error} />}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className={PRIMARY_BTN}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Enregistrer les réglages
          </button>
          {saved && (
            <span role="status" className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
              <Check size={15} /> Réglages enregistrés
            </span>
          )}
          {!saved && settings.updatedAt && (
            <span className="text-xs text-gray-400">Modifiés le {formatDate(settings.updatedAt)}</span>
          )}
        </div>
      </form>

      <section className={cn(CARD_CLASS, "p-4")}>
        <h2 className="font-semibold text-gray-800 mb-2">Comment le prix est calculé</h2>
        <FormulaSteps settings={settings} provisional />
      </section>
    </div>
  );
}
