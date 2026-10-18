"use client";

import { useMemo, useState } from "react";
import { CakeSlice, Check, CopyPlus, Layers, Plus, Search, X } from "lucide-react";
import type { CostItem, PricingSettings } from "@/lib/pricing-types";
import { formatDA, parseDecimal } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { draftHours, draftPortions, numberError, portionsError } from "./draft";
import { formatHours, numberToRaw, quoted, searchKey } from "./format";
import {
  hasContent, partsFromLabel, portionsRatio, priceDraft, scaleDraft, standardSizes, variantProblem,
  type CakeOption, type VariantDraft,
} from "./sheet-draft";
import {
  CheckMark, ChoiceCard, DecimalInput, ErrorBox, INPUT_CLASS, LABEL_CLASS, PRIMARY_BTN, SECONDARY_BTN,
  Sheet,
} from "./ui";

/** Thumbnail of a catalog cake, or a cake icon. */
export function CakeThumb({ image, size = "md" }: { image?: string; size?: "sm" | "md" }) {
  const box = size === "sm" ? "w-10 h-10" : "w-12 h-12";
  return (
    <span className={cn(box, "rounded-xl overflow-hidden shrink-0 bg-rose-50 text-rose-300 flex items-center justify-center")}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <CakeSlice size={size === "sm" ? 17 : 20} />
      )}
    </span>
  );
}

export function CakePicker({
  cakes,
  selectedId,
  onPick,
  onClose,
}: {
  cakes: CakeOption[];
  selectedId: string | null;
  onPick: (cake: CakeOption | null) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = searchKey(query);
  const list = q ? cakes.filter((c) => searchKey(c.title).includes(q)) : cakes;

  const row = (selected: boolean) =>
    cn(
      "w-full flex items-center gap-3 px-5 py-2 min-h-[56px] text-left hover:bg-rose-50 active:bg-rose-100 transition",
      selected && "bg-rose-50/70"
    );

  return (
    <Sheet title="Gâteau du catalogue" onClose={onClose}>
      {cakes.length > 6 && (
        <div className="sticky top-0 bg-white px-4 pt-3 pb-2 z-10">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un gâteau…"
              aria-label="Rechercher un gâteau"
              className={cn(INPUT_CLASS, "pl-9")}
            />
          </div>
        </div>
      )}
      <ul className="pb-3">
        {!q && (
          <li>
            <button type="button" onClick={() => onPick(null)} className={row(selectedId === null)}>
              <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                <X size={17} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-800">Aucun gâteau</span>
                <span className="block text-xs text-gray-400">Fiche sans lien avec le catalogue</span>
              </span>
              {selectedId === null && <Check size={16} className="text-rose-500 shrink-0" />}
            </button>
          </li>
        )}
        {list.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => onPick(c)} className={row(c.id === selectedId)}>
              <CakeThumb image={c.image} size="sm" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-800 truncate">{c.title}</span>
                {!c.published && <span className="block text-xs text-gray-400">non publié</span>}
              </span>
              {c.id === selectedId && <Check size={16} className="text-rose-500 shrink-0" />}
            </button>
          </li>
        ))}
        {q && list.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-gray-400">Aucun gâteau ne correspond à {quoted(query)}.</li>
        )}
        {cakes.length === 0 && (
          <li className="px-5 py-6 text-center text-sm text-gray-400">Votre catalogue ne contient encore aucun gâteau.</li>
        )}
      </ul>
    </Sheet>
  );
}

function HoursCheckbox({ checked, onChange, source }: { checked: boolean; onChange: (v: boolean) => void; source: VariantDraft }) {
  const hours = source.hoursRaw.trim();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 w-full text-left min-h-[44px] py-2 px-1 rounded-lg hover:bg-gray-50"
    >
      <span className="mt-0.5">
        <CheckMark checked={checked} />
      </span>
      <span>
        <span className="block text-sm font-medium text-gray-800">Ajuster aussi les heures de travail</span>
        <span className="block text-xs text-gray-500">
          {hours
            ? "Comme les quantités (au quart d'heure près). Décochez pour garder les mêmes heures."
            : "Aucune heure saisie pour l'instant."}
        </span>
      </span>
    </button>
  );
}

export type NewSize =
  | { kind: "copy"; label: string; portions?: number; factor: number; scaleHours: boolean }
  | { kind: "empty"; label: string; portions?: number };

/**
 * The sizes a dialog is about to create, each with its price and price per
 * part (priceVariant, like everywhere), so she sees the result before « Créer ».
 */
function SizesPreview({
  sizes,
  items,
  settings,
  currentId,
}: {
  sizes: VariantDraft[];
  items: CostItem[];
  settings: PricingSettings;
  currentId?: string;
}) {
  return (
    <ul className="rounded-xl bg-gray-50 divide-y divide-gray-100" aria-live="polite">
      {sizes.map((v) => {
        const priced = priceDraft(v, items, settings);
        const problem = variantProblem(v, priced);
        const parts = draftPortions(v);
        const b = priced.breakdown;
        return (
          <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="min-w-0">
              <span className="block text-sm text-gray-800 truncate">{v.label}</span>
              <span className="block text-xs text-gray-400">
                {v.id === currentId ? "taille actuelle" : parts ? `${parts} parts` : ""}
                {draftHours(v) > 0 ? ` · ${formatHours(draftHours(v))}` : " · 0 h"}
              </span>
            </span>
            {problem ? (
              <span className="text-xs font-medium text-amber-700 text-right">à compléter</span>
            ) : (
              <span className="text-right shrink-0">
                <span className="block text-sm font-bold text-rose-600 tabular-nums">{formatDA(b.finalPrice)}</span>
                {b.pricePerPortion !== null && (
                  <span className="block text-xs text-gray-400 tabular-nums">{formatDA(b.pricePerPortion)} / part</span>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const SAME_EXTRAS = "Les extras et les coûts fixes restent identiques : vérifiez-les dans chaque taille.";

/**
 * New size: empty, or a copy of `source` with its quantities multiplied by a
 * factor (prefilled from the parts ratio: 10 → 15 parts = 1,5).
 */
export function SizeDialog({
  source,
  copyByDefault,
  takenLabels,
  items,
  settings,
  onCreate,
  onClose,
}: {
  source?: VariantDraft;
  copyByDefault: boolean;
  takenLabels: string[];
  items: CostItem[];
  settings: PricingSettings;
  onCreate: (size: NewSize) => void;
  onClose: () => void;
}) {
  const canCopy = !!source && hasContent(source);
  const sourcePortions = source ? draftPortions(source) : undefined;
  const [label, setLabel] = useState("");
  const [labelTouched, setLabelTouched] = useState(false);
  const [partsRaw, setPartsRaw] = useState("");
  const [copy, setCopy] = useState(canCopy && copyByDefault);
  const [factorRaw, setFactorRaw] = useState("1");
  const [factorTouched, setFactorTouched] = useState(false);
  const [scaleHours, setScaleHours] = useState(true);
  const [error, setError] = useState("");

  const portions = draftPortions({ portionsRaw: partsRaw });
  const factor = numberError(factorRaw) ? null : parseDecimal(factorRaw);
  const preview = useMemo(
    () =>
      copy && source && factor !== null && factor > 0
        ? scaleDraft(source, items, { label: label.trim() || "Nouvelle taille", portions, factor, scaleHours })
        : null,
    [copy, source, items, label, portions, factor, scaleHours]
  );

  function onParts(raw: string) {
    setPartsRaw(raw);
    const parts = draftPortions({ portionsRaw: raw });
    if (!labelTouched) setLabel(parts ? `${parts} parts` : "");
    const ratio = portionsRatio(sourcePortions, parts);
    if (!factorTouched && ratio !== null) setFactorRaw(numberToRaw(ratio));
  }

  function onLabel(value: string) {
    setLabel(value);
    setLabelTouched(true);
  }

  function submit() {
    const name = label.trim();
    if (!name) return setError("Donnez un nom à cette taille (ex : 11 à 15 parts).");
    if (takenLabels.some((l) => searchKey(l) === searchKey(name))) return setError(`La taille ${quoted(name)} existe déjà.`);
    // Parts are required: taken from the label when it has a number (« 11 à 15 parts » → 15).
    const parts = portions ?? (partsRaw.trim() === "" ? partsFromLabel(name) : undefined);
    const partsErr = portionsError(partsRaw);
    if (partsErr) return setError(`Nombre de parts : ${partsErr}.`);
    if (!parts) return setError("Indiquez le nombre de parts de cette taille (ex : 15).");
    if (!copy) return onCreate({ kind: "empty", label: name, portions: parts });
    if (factor === null || factor <= 0) return setError("Multiplier les quantités par : indiquez un nombre (ex : 1,5).");
    onCreate({ kind: "copy", label: name, portions: parts, factor, scaleHours });
  }

  return (
    <Sheet
      title={copyByDefault && canCopy ? "Dupliquer pour une autre taille" : "Nouvelle taille"}
      onClose={onClose}
      dirty={label.trim() !== "" || partsRaw.trim() !== ""}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className={SECONDARY_BTN}>
            Annuler
          </button>
          <button type="submit" form="size-form" className={PRIMARY_BTN}>
            <Plus size={15} className="shrink-0" /> Créer la taille
          </button>
        </div>
      }
    >
      <form
        id="size-form"
        className="p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
          <div>
            <label htmlFor="size-label" className={LABEL_CLASS}>Nom de la taille</label>
            <input
              id="size-label"
              type="text"
              value={label}
              onChange={(e) => onLabel(e.target.value)}
              onBlur={() => {
                const n = partsFromLabel(label);
                if (partsRaw.trim() === "" && n) onParts(String(n));
              }}
              placeholder="Ex : 11 à 15 parts"
              maxLength={60}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="size-parts" className={LABEL_CLASS}>Parts</label>
            <DecimalInput
              id="size-parts"
              value={partsRaw}
              onChange={onParts}
              inputMode="numeric"
              placeholder="Ex : 15"
              error={portionsError(partsRaw)}
              autoFocus
            />
          </div>
        </div>

        {canCopy && source && (
          <fieldset className="space-y-2">
            <legend className={LABEL_CLASS}>Contenu</legend>
            <div role="radiogroup" className="grid grid-cols-1 gap-2">
              <ChoiceCard
                selected={copy}
                onClick={() => setCopy(true)}
                icon={<CopyPlus size={17} />}
                title={`Partir de ${quoted(source.label || "cette taille")}`}
                text="Mêmes ingrédients, quantités ajustées."
              />
              <ChoiceCard
                selected={!copy}
                onClick={() => setCopy(false)}
                icon={<Plus size={17} />}
                title="Taille vide"
                text="Vous ajoutez tout vous-même."
              />
            </div>
          </fieldset>
        )}

        {copy && source && (
          <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-2">
            <div className="flex items-center gap-3">
              <label htmlFor="size-factor" className="text-sm text-gray-700 flex-1">
                Multiplier les quantités par
              </label>
              <DecimalInput
                id="size-factor"
                value={factorRaw}
                onChange={(v) => {
                  setFactorRaw(v);
                  setFactorTouched(true);
                }}
                className="w-24"
                inputClassName="text-center"
              />
            </div>
            <p className="text-xs text-gray-500">
              {sourcePortions
                ? `${quoted(source.label)} = ${sourcePortions} parts. Ex : pour 15 parts, × 1,5.`
                : "Ex : × 1,5 pour une taille une fois et demie plus grande."}
            </p>
            <HoursCheckbox checked={scaleHours} onChange={setScaleHours} source={source} />
            <p className="text-xs text-gray-500">{SAME_EXTRAS}</p>
          </div>
        )}

        {preview && (
          <div>
            <p className={LABEL_CLASS}>Résultat</p>
            <SizesPreview sizes={[preview]} items={items} settings={settings} />
          </div>
        )}

        {error && <ErrorBox>{error}</ErrorBox>}
      </form>
    </Sheet>
  );
}

/** Confirms « Créer les 4 tailles standard » when there is content to copy, showing each resulting price. */
export function StandardSizesDialog({
  variants,
  items,
  settings,
  onCreate,
  onClose,
}: {
  variants: VariantDraft[];
  items: CostItem[];
  settings: PricingSettings;
  onCreate: (scaleHours: boolean) => void;
  onClose: () => void;
}) {
  const [scaleHours, setScaleHours] = useState(true);
  const source = variants[0];
  const base = source ? draftPortions(source) : undefined;
  const result = useMemo(() => standardSizes(variants, items, scaleHours), [variants, items, scaleHours]);
  if (!source) return null;
  return (
    <Sheet
      title="Créer les 4 tailles standard"
      onClose={onClose}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className={SECONDARY_BTN}>
            Annuler
          </button>
          <button type="button" onClick={() => onCreate(scaleHours)} className={PRIMARY_BTN}>
            <Layers size={15} className="shrink-0" /> Créer
          </button>
        </div>
      }
    >
      <div className="p-5 space-y-4 text-sm text-gray-600">
        <p>
          Les autres tailles reprennent le contenu de {quoted(source.label || "cette taille")}
          {base ? ", quantités ajustées selon le nombre de parts." : " (indiquez ensuite les quantités de chaque taille)."}
        </p>
        <HoursCheckbox checked={scaleHours} onChange={setScaleHours} source={source} />
        <SizesPreview sizes={result} items={items} settings={settings} currentId={source.id} />
        <p className="text-xs text-gray-500">{SAME_EXTRAS} Vous pourrez ensuite modifier chaque taille.</p>
      </div>
    </Sheet>
  );
}
