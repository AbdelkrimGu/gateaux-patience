"use client";

import { useEffect, useState } from "react";
import {
  Check, ChevronDown, ChevronUp, History, Loader2, Package, Pencil, Plus, Scale, Search, Trash2,
  Wallet,
} from "lucide-react";
import { lineCost } from "@/lib/pricing-formula";
import type { CostItem, CostItemInput, CostItemPatch, CostKind, PriceTemplate } from "@/lib/pricing-types";
import {
  parseDecimal, unitLabel, UNITS, VARIABLE_UNIT_CODES, type UnitCode, type UnitFamily,
} from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { apiJson, errorText, type ErrorInfo } from "./api";
import { numberError } from "./draft";
import {
  formatDate, formatDateTime, groupItems, numberToRaw, priceLabel, quoted, searchKey,
} from "./format";
import { sheetsBrokenBy, sheetsUsing, usageText } from "./sheet-draft";
import {
  ApiErrorBox, CARD_CLASS, ChoiceCard, ConfirmDialog, DecimalInput, ICON_BTN, INPUT_CLASS,
  LABEL_CLASS, PRIMARY_BTN, SECONDARY_BTN, Sheet,
} from "./ui";

interface Props {
  items: CostItem[];
  templates: PriceTemplate[]; // to warn before deleting a cost a price sheet uses
  onSaved: (item: CostItem, created: boolean) => void;
  onDeleted: (id: string) => void;
}

interface FormData {
  kind: CostKind | null;
  name: string;
  group: string;
  priceRaw: string;
  priceQtyRaw: string;
  unit: UnitCode;
  customUnit: string;
  note: string;
}

type FormState =
  | { mode: "new"; data: FormData; initial: FormData }
  | { mode: "edit"; item: CostItem; data: FormData; initial: FormData };

type FormError = ErrorInfo;

const SECTIONS: Array<{ kind: CostKind; title: string; empty: string }> = [
  {
    kind: "fixed",
    title: "Coûts fixes — inclus dans chaque gâteau",
    empty: "Boîte, support, part de gaz et d'électricité… tout ce que chaque gâteau coûte, quel qu'il soit.",
  },
  {
    kind: "variable",
    title: "Coûts variables — selon la quantité",
    empty: "Amandes au kilo, chocolat à la pièce, ruban au mètre… la quantité change d'un gâteau à l'autre.",
  },
];

function samePrice(a: CostItem, b: CostItem) {
  return (
    a.price === b.price &&
    a.priceQty === b.priceQty &&
    a.unit === b.unit &&
    (a.customUnit ?? "") === (b.customUnit ?? "")
  );
}

function sameForm(a: FormData, b: FormData) {
  return (Object.keys(a) as Array<keyof FormData>).every((k) => a[k] === b[k]);
}

/** Only what changed, so a stale screen can't overwrite fields edited elsewhere. */
function costPatch(before: CostItem, input: CostItemInput): CostItemPatch {
  const patch: CostItemPatch = {};
  if (input.name !== before.name) patch.name = input.name;
  if (input.kind !== before.kind) patch.kind = input.kind;
  // Empty strings so the server clears a removed group / note / custom unit
  // (undefined would simply be dropped from the JSON).
  if ((input.group ?? "") !== (before.group ?? "")) patch.group = input.group ?? "";
  if (input.price !== before.price) patch.price = input.price;
  if (input.priceQty !== before.priceQty) patch.priceQty = input.priceQty;
  if (input.unit !== before.unit) patch.unit = input.unit;
  if ((input.customUnit ?? "") !== (before.customUnit ?? "")) patch.customUnit = input.customUnit ?? "";
  if ((input.note ?? "") !== (before.note ?? "")) patch.note = input.note ?? "";
  return patch;
}

export default function CostLibrary({ items, templates, onSaved, onDeleted }: Props) {
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [deleting, setDeleting] = useState<{ item: CostItem; loading: boolean } | null>(null);
  const [openHistory, setOpenHistory] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<{ id: string; text: string } | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 8000);
    return () => clearTimeout(t);
  }, [flash]);

  // After add / edit: bring the row into view and light it up briefly.
  useEffect(() => {
    if (!highlight) return;
    const raf = requestAnimationFrame(() =>
      document.getElementById(`cost-${highlight}`)?.scrollIntoView({ block: "center", behavior: "smooth" })
    );
    const t = setTimeout(() => setHighlight(null), 2500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [highlight]);

  const groups = Array.from(new Set(items.map((i) => i.group?.trim()).filter((g): g is string => !!g))).sort(
    (a, b) => a.localeCompare(b, "fr")
  );
  const q = searchKey(query);
  const visible = q
    ? items.filter((i) => searchKey(`${i.name} ${i.group ?? ""} ${i.note ?? ""}`).includes(q))
    : items;

  function startNew(kind: CostKind | null) {
    setFormError(null);
    const data: FormData = {
      kind, name: "", group: "", priceRaw: "", priceQtyRaw: "1", unit: "kg", customUnit: "", note: "",
    };
    setForm({ mode: "new", data, initial: data });
  }

  function startEdit(item: CostItem) {
    setFormError(null);
    const data: FormData = {
      kind: item.kind,
      name: item.name,
      group: item.group ?? "",
      priceRaw: numberToRaw(item.price),
      priceQtyRaw: item.kind === "variable" ? numberToRaw(item.priceQty) : "1",
      unit: item.kind === "variable" ? item.unit : "kg",
      customUnit: item.customUnit ?? "",
      note: item.note ?? "",
    };
    setForm({ mode: "edit", item, data, initial: data });
  }

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => (f ? { ...f, data: { ...f.data, [key]: value } } : f));
  }

  function done(id: string, text: string) {
    setForm(null);
    setFlash({ id, text });
    setHighlight(id);
  }

  async function submit() {
    if (!form) return;
    const d = form.data;
    const fail = (text: string) => setFormError({ text, conflict: false });
    const name = d.name.trim();
    const price = parseDecimal(d.priceRaw);
    const priceQty = parseDecimal(d.priceQtyRaw);
    if (!d.kind) return fail("Choisissez le type de coût : fixe ou variable.");
    if (!name) return fail("Donnez un nom à ce coût.");
    const priceErr = numberError(d.priceRaw);
    if (priceErr || price === null) return fail(`Prix : ${priceErr ?? "indiquez un montant (ex : 1450 ou 12,5)"}.`);
    if (d.kind === "variable") {
      const qtyErr = numberError(d.priceQtyRaw);
      if (qtyErr) return fail(`Quantité achetée : ${qtyErr}.`);
      if (priceQty === null || priceQty <= 0) return fail("La quantité achetée doit être supérieure à 0.");
      if (d.unit === "custom" && !d.customUnit.trim())
        return fail("Indiquez le nom de l'unité (ex : couche, sachet).");
    }

    const variable = d.kind === "variable";
    const input: CostItemInput = {
      name,
      kind: d.kind,
      group: d.group.trim() || undefined,
      price,
      priceQty: variable ? (priceQty as number) : 1,
      unit: variable ? d.unit : "forfait",
      customUnit: variable && d.unit === "custom" ? d.customUnit.trim() : undefined,
      note: d.note.trim() || undefined,
    };

    setSaving(true);
    setFormError(null);
    try {
      if (form.mode === "new") {
        const created = await apiJson<CostItem>("/api/admin/pricing/costs", "POST", input, "La création a échoué.");
        onSaved(created, true);
        // Make sure the new row isn't hidden by an old search.
        if (q && !searchKey(`${created.name} ${created.group ?? ""} ${created.note ?? ""}`).includes(q)) setQuery("");
        done(created.id, "Coût ajouté.");
      } else {
        const before = form.item;
        const patch = costPatch(before, input);
        if (Object.keys(patch).length === 0) {
          done(before.id, "Aucune modification.");
          return;
        }
        const body: CostItemPatch = { ...patch, expectedUpdatedAt: before.updatedAt };
        const updated = await apiJson<CostItem>(
          `/api/admin/pricing/costs/${before.id}`,
          "PUT",
          body,
          "La mise à jour a échoué."
        );
        onSaved(updated, false);
        if (!samePrice(before, updated)) {
          setOpenHistory((s) => new Set(s).add(updated.id));
          done(updated.id, `Nouveau prix enregistré. L'ancien (${priceLabel(before)}) est gardé dans l'historique.`);
        } else {
          done(updated.id, "Modifications enregistrées.");
        }
      }
    } catch (e) {
      setFormError(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { item } = deleting;
    setDeleting({ item, loading: true });
    try {
      await apiJson<{ ok: true }>(`/api/admin/pricing/costs/${item.id}`, "DELETE", undefined, "La suppression a échoué.");
      onDeleted(item.id);
      setError(null);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setDeleting(null);
    }
  }

  function toggleHistory(id: string) {
    setOpenHistory((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un coût…"
            aria-label="Rechercher un coût"
            className={cn(INPUT_CLASS, "pl-9")}
          />
        </div>
        <button type="button" onClick={() => startNew(null)} className={PRIMARY_BTN}>
          <Plus size={15} /> Ajouter un coût
        </button>
      </div>

      {error && <ApiErrorBox error={error} />}

      {items.length === 0 && (
        <div className={cn(CARD_CLASS, "text-center py-10 px-4")}>
          <Wallet size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="font-semibold text-gray-700">Votre liste de coûts est vide</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            Ajoutez ce que vous achetez pour vos gâteaux, avec son prix. Le calcul s&apos;en servira
            automatiquement.
          </p>
        </div>
      )}

      {SECTIONS.map((section) => {
        const all = items.filter((i) => i.kind === section.kind);
        const list = visible.filter((i) => i.kind === section.kind);
        if (items.length > 0 && q && list.length === 0) return null;
        return (
          <section key={section.kind} className={CARD_CLASS}>
            <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-800">{section.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {all.length} élément{all.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startNew(section.kind)}
                className="inline-flex items-center gap-1 min-h-[40px] px-3 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition shrink-0"
              >
                <Plus size={15} /> Ajouter
              </button>
            </div>
            {list.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-gray-400">{section.empty}</p>
            ) : (
              groupItems(list).map(([group, groupList]) => (
                <div key={group}>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{group}</p>
                  <ul className="divide-y divide-gray-100 border-t border-gray-50">
                    {groupList.map((item) => (
                      <CostRow
                        key={item.id}
                        item={item}
                        historyOpen={openHistory.has(item.id)}
                        flash={flash?.id === item.id ? flash.text : ""}
                        highlighted={highlight === item.id}
                        onToggleHistory={() => toggleHistory(item.id)}
                        onEdit={() => startEdit(item)}
                        onDelete={() => setDeleting({ item, loading: false })}
                      />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>
        );
      })}

      {q && visible.length === 0 && items.length > 0 && (
        <p className="text-center text-sm text-gray-400 py-6">Aucun coût ne correspond à {quoted(query)}.</p>
      )}

      {form && (
        <CostForm
          form={form}
          groups={groups}
          templates={templates}
          saving={saving}
          error={formError}
          onField={setField}
          onSubmit={submit}
          onClose={() => !saving && setForm(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Supprimer ce coût ?"
          confirmLabel="Supprimer"
          loading={deleting.loading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        >
          <p>{quoted(deleting.item.name)} sera retiré de votre liste, avec son historique de prix.</p>
          <DeleteImpact item={deleting.item} templates={templates} />
          <p className="text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            Les devis déjà enregistrés ne changent pas : ils gardent les prix du moment.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}

/** What deleting this cost does to the price sheets, which follow the library live. */
function DeleteImpact({ item, templates }: { item: CostItem; templates: PriceTemplate[] }) {
  if (item.kind === "fixed") {
    if (templates.length === 0) return null;
    return (
      <p className="text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
        Ce coût fixe est compté dans vos fiches prix : leurs prix seront recalculés sans lui.
      </p>
    );
  }
  const usage = sheetsUsing(templates, item.id);
  if (usage.length === 0) return null;
  return (
    <p className="text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
      Utilisé dans {usage.length > 1 ? `${usage.length} fiches` : "1 fiche"} : {usageText(usage)}. Ces lignes
      seront signalées dans les fiches pour que vous les retiriez.
    </p>
  );
}

function CostRow({
  item,
  historyOpen,
  flash,
  highlighted,
  onToggleHistory,
  onEdit,
  onDelete,
}: {
  item: CostItem;
  historyOpen: boolean;
  flash: string;
  highlighted: boolean;
  onToggleHistory: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const history = [...(item.priceHistory ?? [])].reverse(); // newest first
  return (
    <li
      id={`cost-${item.id}`}
      className={cn(
        "transition-colors duration-700",
        highlighted ? "bg-emerald-100/70" : flash ? "bg-emerald-50/50" : "bg-transparent"
      )}
    >
      <div className="flex items-center gap-1 pl-4 pr-2 py-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{item.name}</p>
          <p className="text-sm font-semibold text-rose-600 tabular-nums">{priceLabel(item)}</p>
          <p className="text-xs text-gray-400">
            {item.group ? `${item.group} · ` : ""}modifié le {formatDate(item.updatedAt)}
          </p>
          {item.note && <p className="text-xs text-gray-500 italic mt-0.5">{item.note}</p>}
        </div>
        <button type="button" onClick={onEdit} className={cn(ICON_BTN, "hover:text-rose-500 hover:bg-rose-50")} aria-label={`Modifier ${item.name}`}>
          <Pencil size={15} />
        </button>
        <button type="button" onClick={onDelete} className={cn(ICON_BTN, "hover:text-red-500 hover:bg-red-50")} aria-label={`Supprimer ${item.name}`}>
          <Trash2 size={15} />
        </button>
      </div>
      {flash && (
        <p role="status" className="mx-4 mb-2 flex items-start gap-1.5 text-xs text-emerald-700">
          <Check size={13} className="mt-0.5 shrink-0" /> {flash}
        </p>
      )}
      {history.length > 0 && (
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={onToggleHistory}
            aria-expanded={historyOpen}
            className="inline-flex items-center gap-1.5 min-h-[40px] pr-2 text-xs font-medium text-gray-500 hover:text-rose-600"
          >
            <History size={13} />
            Historique des prix ({history.length})
            {historyOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {historyOpen && (
            <ul className="mt-1 mb-1 rounded-lg bg-gray-50 px-3 py-2 space-y-1 text-xs">
              <li className="flex justify-between gap-3 text-gray-700">
                <span>Prix actuel</span>
                <span className="font-semibold tabular-nums">{priceLabel(item)}</span>
              </li>
              {history.map((h, i) => (
                <li key={`${h.at}-${i}`} className="flex justify-between gap-3 text-gray-500">
                  <span>jusqu&apos;au {formatDateTime(h.at)}</span>
                  <span className="tabular-nums text-right">{priceLabel(h)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

// "Soit" shows the price for a whole kg / L / m / pièce, the way she compares prices.
const REFERENCE_UNIT: Partial<Record<UnitFamily, UnitCode>> = {
  mass: "kg",
  volume: "l",
  length: "m",
  count: "piece",
};

function pricePreview(d: FormData): { main: string; sub?: string } | null {
  const price = parseDecimal(d.priceRaw);
  if (price === null || price < 0 || numberError(d.priceRaw)) return null;
  if (d.kind === "fixed") return { main: priceLabel({ price, priceQty: 1, unit: "forfait" }) };
  if (d.kind !== "variable") return null;
  const priceQty = parseDecimal(d.priceQtyRaw);
  if (priceQty === null || priceQty <= 0 || numberError(d.priceQtyRaw)) return null;
  const typed = { price, priceQty, unit: d.unit, customUnit: d.customUnit.trim() || undefined };
  const ref = REFERENCE_UNIT[UNITS[d.unit].family] ?? d.unit;
  if (priceQty === 1 && ref === d.unit) return { main: priceLabel(typed) };
  // Same math as the calculator: the cost of 1 reference unit.
  const { cost } = lineCost({
    key: "preview", costItemId: null, kind: "variable", name: "", ...typed, qty: 1, qtyUnit: ref,
  });
  return {
    main: priceLabel({ price: cost, priceQty: 1, unit: ref, customUnit: typed.customUnit }),
    sub: priceLabel(typed),
  };
}

/**
 * What this change does to the price sheets (they follow the library live):
 * lines that will no longer be priceable, or a fixed cost that every sheet will count.
 */
function sheetImpact(form: FormState, templates: PriceTemplate[]): { tone: "amber" | "gray"; text: string } | null {
  const d = form.data;
  if (!d.kind || templates.length === 0) return null;
  const was = form.mode === "edit" ? form.item : null;
  if (was && was.kind === "variable") {
    const unit = d.kind === "variable" ? d.unit : "forfait";
    const broken = sheetsBrokenBy(templates, was.id, { kind: d.kind, unit });
    if (broken.length) {
      const why = d.kind === "fixed" ? "il devient un coût fixe" : "la nouvelle unité ne correspond plus aux quantités saisies";
      return {
        tone: "amber",
        text: `Utilisé dans ${broken.length > 1 ? `${broken.length} fiches` : "1 fiche"} : ${usageText(broken)}. Si vous enregistrez, ${why} : ces lignes seront à corriger dans les fiches.`,
      };
    }
  }
  if (d.kind === "fixed" && (!was || was.kind !== "fixed")) {
    const n = templates.length;
    return {
      tone: "gray",
      text: `Sera compté dans ${n > 1 ? `vos ${n} fiches prix` : "votre fiche prix"} (vous pourrez le décocher pour une taille).`,
    };
  }
  return null;
}

function CostForm({
  form,
  groups,
  templates,
  saving,
  error,
  onField,
  onSubmit,
  onClose,
}: {
  form: FormState;
  groups: string[];
  templates: PriceTemplate[];
  saving: boolean;
  error: FormError | null;
  onField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const d = form.data;
  const editing = form.mode === "edit";
  // Editing is almost always a price change: the type choice folds to one line.
  const [kindOpen, setKindOpen] = useState(!editing);
  const preview = pricePreview(d);
  const priceQty = parseDecimal(d.priceQtyRaw) ?? undefined;
  const impact = sheetImpact(form, templates);

  const kindBlock = kindOpen || !d.kind ? (
    <fieldset>
      <legend className={LABEL_CLASS}>Type de coût</legend>
      <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <ChoiceCard
          selected={d.kind === "fixed"}
          onClick={() => onField("kind", "fixed")}
          icon={<Package size={18} />}
          title="Coût fixe"
          text="Compté dans chaque gâteau, toujours le même montant. Ex : boîte, support, gaz."
        />
        <ChoiceCard
          selected={d.kind === "variable"}
          onClick={() => onField("kind", "variable")}
          icon={<Scale size={18} />}
          title="Coût variable"
          text="Prix au kilo, à la pièce, au mètre… Vous indiquez la quantité pour chaque gâteau."
        />
      </div>
    </fieldset>
  ) : (
    <div className="flex items-center gap-2 rounded-xl bg-gray-50 pl-3 pr-1 text-sm text-gray-700">
      {d.kind === "fixed" ? <Package size={15} className="text-gray-400" /> : <Scale size={15} className="text-gray-400" />}
      <span>{d.kind === "fixed" ? "Coût fixe" : "Coût variable"}</span>
      <span className="text-gray-300">·</span>
      <button
        type="button"
        onClick={() => setKindOpen(true)}
        className="min-h-[40px] px-2 font-medium text-rose-600 underline underline-offset-2"
      >
        changer
      </button>
    </div>
  );

  const priceBlock =
    d.kind === "fixed" ? (
      <div>
        <label htmlFor="cost-price" className={LABEL_CLASS}>Montant par gâteau</label>
        <DecimalInput
          id="cost-price"
          value={d.priceRaw}
          onChange={(v) => onField("priceRaw", v)}
          suffix="DA"
          placeholder="0"
          autoFocus={editing}
        />
      </div>
    ) : (
      <div className="space-y-2">
        <div>
          <label htmlFor="cost-price" className={LABEL_CLASS}>Prix d&apos;achat</label>
          <DecimalInput
            id="cost-price"
            value={d.priceRaw}
            onChange={(v) => onField("priceRaw", v)}
            suffix="DA"
            placeholder="Ex : 1450"
            autoFocus={editing}
          />
        </div>
        <div>
          <p id="cost-qty-label" className={LABEL_CLASS}>Pour la quantité</p>
          <div className="grid grid-cols-2 gap-2">
            <DecimalInput
              value={d.priceQtyRaw}
              onChange={(v) => onField("priceQtyRaw", v)}
              aria-labelledby="cost-qty-label"
              inputClassName="text-center"
            />
            <select
              value={d.unit}
              onChange={(e) => onField("unit", e.target.value as UnitCode)}
              aria-label="Unité"
              className={INPUT_CLASS}
            >
              {VARIABLE_UNIT_CODES.map((u) => (
                <option key={u} value={u}>
                  {u === "custom" ? "autre unité…" : unitLabel(u, undefined, priceQty)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {d.unit === "custom" && (
          <div>
            <label htmlFor="cost-custom-unit" className={LABEL_CLASS}>Nom de l&apos;unité</label>
            <input
              id="cost-custom-unit"
              type="text"
              value={d.customUnit}
              onChange={(e) => onField("customUnit", e.target.value)}
              placeholder="Ex : couche, sachet, boîte"
              maxLength={20}
              className={INPUT_CLASS}
            />
          </div>
        )}
        <p className="text-xs text-gray-400">Ex : 1450 DA pour 1 kg d&apos;amandes, ou 1200 DA pour 30 pièces.</p>
      </div>
    );

  const previewBlock = preview && (
    <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3" aria-live="polite">
      <p className="text-xs font-medium text-rose-700">Soit</p>
      <p className="text-lg font-bold text-rose-600 tabular-nums leading-tight">{preview.main}</p>
      {preview.sub && <p className="text-xs text-gray-500 mt-0.5">({preview.sub})</p>}
    </div>
  );

  const nameBlock = (
    <div>
      <label htmlFor="cost-name" className={LABEL_CLASS}>Nom</label>
      <input
        id="cost-name"
        type="text"
        value={d.name}
        onChange={(e) => onField("name", e.target.value)}
        placeholder={d.kind === "fixed" ? "Ex : Boîte à gâteau" : "Ex : Amandes en poudre"}
        maxLength={80}
        className={INPUT_CLASS}
      />
    </div>
  );

  const groupBlock = (
    <div>
      <label htmlFor="cost-group" className={LABEL_CLASS}>Groupe (optionnel)</label>
      <input
        id="cost-group"
        type="text"
        list="pricing-groups"
        value={d.group}
        onChange={(e) => onField("group", e.target.value)}
        placeholder="Ex : Ingrédients, Emballage, Décoration"
        maxLength={40}
        className={INPUT_CLASS}
      />
      <datalist id="pricing-groups">
        {groups.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
    </div>
  );

  const noteBlock = (
    <div>
      <label htmlFor="cost-note" className={LABEL_CLASS}>Note (optionnel)</label>
      <textarea
        id="cost-note"
        value={d.note}
        onChange={(e) => onField("note", e.target.value)}
        rows={2}
        placeholder="Ex : marque, fournisseur"
        maxLength={300}
        className={cn(INPUT_CLASS, "resize-y")}
      />
    </div>
  );

  return (
    <Sheet
      title={editing ? "Modifier le coût" : "Nouveau coût"}
      onClose={onClose}
      dirty={!sameForm(form.data, form.initial)}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} disabled={saving} className={SECONDARY_BTN}>
            Annuler
          </button>
          <button type="submit" form="cost-form" disabled={saving} className={PRIMARY_BTN}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Enregistrer
          </button>
        </div>
      }
    >
      <form
        id="cost-form"
        className="p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {kindBlock}

        {d.kind &&
          (editing ? (
            <>
              {priceBlock}
              {previewBlock}
              {nameBlock}
              {groupBlock}
              {noteBlock}
              <p className="text-xs text-gray-500">
                Si vous changez le prix, l&apos;ancien prix est gardé dans l&apos;historique.
              </p>
            </>
          ) : (
            <>
              {nameBlock}
              {groupBlock}
              {priceBlock}
              {previewBlock}
              {noteBlock}
            </>
          ))}

        {impact && (
          <p
            role={impact.tone === "amber" ? "alert" : undefined}
            className={cn(
              "text-sm rounded-xl px-4 py-3",
              impact.tone === "amber" ? "bg-amber-50 text-amber-800" : "bg-gray-50 text-gray-600"
            )}
          >
            {impact.text}
          </p>
        )}

        {error && <ApiErrorBox error={error} />}
      </form>
    </Sheet>
  );
}
