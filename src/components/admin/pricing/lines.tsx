"use client";

// Editable rows shared by the calculator (Calculer) and the price-sheet editor
// (Fiches): same inputs, same messages, so both screens feel identical.

import type { ReactNode } from "react";
import { AlertTriangle, Clock, Plus, Trash2 } from "lucide-react";
import { compatibleUnits, formatDA, parseDecimal, parseHours, unitLabel, type UnitCode } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { hoursError, numberError, type DraftLine } from "./draft";
import { formatHours, priceLabel } from "./format";
import { CheckMark, DecimalInput, FieldError, ICON_BTN, INPUT_CLASS, LABEL_CLASS, SECONDARY_BTN } from "./ui";

export function HoursField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (raw: string) => void;
}) {
  const err = hoursError(value);
  const h = parseHours(value) ?? 0;
  const hint = value.trim() === "" ? "Ex : 2,5 pour 2 h 30" : h > 0 && !Number.isInteger(h) ? `= ${formatHours(h)}` : "";
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>Heures de travail</label>
      <DecimalInput id={id} value={value} onChange={onChange} suffix="h" placeholder="0" error={err} />
      {!err && hint && (
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <Clock size={11} /> {hint}
        </p>
      )}
    </div>
  );
}

/** A fixed cost: tick it (or not) for this cake, with a multiplier. */
export function FixedLineRow({
  line: l,
  cost,
  flag,
  hint,
  onToggle,
  onQtyChange,
}: {
  line: DraftLine;
  cost: number;
  flag?: ReactNode; // after the price ("(supprimé de la liste)")
  hint?: ReactNode; // under the row ("nouveau prix : …")
  onToggle: () => void;
  onQtyChange: (raw: string) => void;
}) {
  const err = l.included ? numberError(l.qtyRaw) : null;
  const missing = l.included && !err && l.qtyRaw.trim() === "";
  return (
    <li className={cn("pl-2 pr-4 py-1.5", !l.included && "opacity-60")}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={l.included}
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 min-w-0 text-left min-h-[44px] px-2 rounded-lg hover:bg-gray-50"
        >
          <CheckMark checked={l.included} />
          <span className="min-w-0">
            <span className={cn("block text-sm font-medium truncate", l.included ? "text-gray-800" : "text-gray-500 line-through")}>
              {l.name}
            </span>
            <span className="block text-xs text-gray-400 truncate">
              {priceLabel(l)}
              {flag}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-gray-400" aria-hidden>×</span>
          <DecimalInput
            id={`line-${l.key}`}
            value={l.qtyRaw}
            onChange={onQtyChange}
            disabled={!l.included}
            aria-label={`Quantité pour ${l.name}`}
            className="w-14"
            inputClassName="px-2 text-center"
            error={err}
            showError={false}
            missing={missing}
          />
        </div>
        <span className="w-[4.5rem] text-right text-sm tabular-nums text-gray-700 shrink-0">{formatDA(cost)}</span>
      </div>
      {hint}
      {err && <FieldError className="pl-10 mt-0">{err}</FieldError>}
      {missing && <p className="pl-10 text-xs text-amber-700">Indiquez combien (1 en général).</p>}
    </li>
  );
}

/**
 * A variable cost: quantity + unit. `blocked`: the line can't be priced at all
 * (its cost was deleted) — only the message and the remove button are shown.
 */
export function VariableLineRow({
  line: l,
  cost,
  error,
  flag,
  hint,
  blocked,
  onQtyChange,
  onUnitChange,
  onRemove,
}: {
  line: DraftLine;
  cost: number;
  error?: string; // computePrice() could not price it (incompatible units…)
  flag?: ReactNode;
  hint?: ReactNode;
  blocked?: string;
  onQtyChange: (raw: string) => void;
  onUnitChange: (u: UnitCode) => void;
  onRemove: () => void;
}) {
  if (blocked) {
    return (
      <li className="px-4 py-3 bg-red-50/60">
        <div className="flex items-start gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">{l.name}</p>
            <p className="text-xs text-red-700">{blocked}</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            data-problem="true"
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 -my-1 rounded-lg bg-white border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 transition shrink-0"
          >
            <Trash2 size={14} /> Retirer
          </button>
        </div>
      </li>
    );
  }
  const units = compatibleUnits(l.unit);
  const unitOptions: UnitCode[] = units.includes(l.qtyUnit) ? units : [l.qtyUnit, ...units];
  const err = numberError(l.qtyRaw);
  const missing = !err && l.qtyRaw.trim() === "";
  const qty = parseDecimal(l.qtyRaw) ?? undefined;
  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">
            {l.name}
            {flag}
          </p>
          <p className="text-xs text-gray-400">{priceLabel(l)}</p>
          {hint}
        </div>
        <span className="pt-0.5 text-sm font-semibold tabular-nums text-gray-800 whitespace-nowrap">{formatDA(cost)}</span>
        <button
          type="button"
          onClick={onRemove}
          className={cn(ICON_BTN, "-mt-2 -mr-2 hover:text-red-500 hover:bg-red-50")}
          aria-label={`Retirer ${l.name}`}
        >
          <Trash2 size={15} />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <DecimalInput
          id={`line-${l.key}`}
          value={l.qtyRaw}
          onChange={onQtyChange}
          placeholder="Quantité"
          aria-label={`Quantité de ${l.name}`}
          className="w-32"
          error={err}
          showError={false}
          missing={missing}
          data-problem={error && unitOptions.length <= 1 ? "true" : undefined}
        />
        {unitOptions.length > 1 ? (
          <select
            value={l.qtyUnit}
            onChange={(e) => onUnitChange(e.target.value as UnitCode)}
            aria-label="Unité"
            // An incompatible unit is fixed by picking another one here.
            data-problem={error ? "true" : undefined}
            className={cn(INPUT_CLASS, "w-auto min-w-[5.5rem]")}
          >
            {unitOptions.map((u) => (
              <option key={u} value={u}>{unitLabel(u, l.customUnit, qty)}</option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-gray-600">{unitLabel(l.qtyUnit, l.customUnit, qty)}</span>
        )}
      </div>
      {err ? (
        <FieldError>{err}</FieldError>
      ) : error ? (
        <FieldError>{error}</FieldError>
      ) : missing ? (
        <p className="text-xs text-amber-700 mt-1">Indiquez la quantité utilisée.</p>
      ) : null}
    </li>
  );
}

/** A one-off purchase for this cake: a name and an amount. */
export function ExtraLineRow({
  line: l,
  onNameChange,
  onAmountChange,
  onRemove,
}: {
  line: DraftLine;
  onNameChange: (name: string) => void;
  onAmountChange: (raw: string) => void;
  onRemove: () => void;
}) {
  const err = numberError(l.amountRaw);
  const missing = !err && l.amountRaw.trim() === "";
  return (
    <li className="px-4 py-2.5">
      {/* Phones: name on its own row so long names aren't clipped. */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          id={`line-${l.key}`}
          type="text"
          value={l.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ex : topper doré"
          aria-label="Nom de l'extra"
          maxLength={100}
          className={cn(INPUT_CLASS, "sm:flex-1 min-w-0")}
        />
        <div className="flex items-center gap-2">
          <DecimalInput
            value={l.amountRaw}
            onChange={onAmountChange}
            suffix="DA"
            placeholder="Montant"
            aria-label="Montant"
            className="flex-1 sm:flex-none sm:w-32"
            error={err}
            showError={false}
            missing={missing}
          />
          <button
            type="button"
            onClick={onRemove}
            className={cn(ICON_BTN, "hover:text-red-500 hover:bg-red-50")}
            aria-label="Retirer cet extra"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {err && <FieldError>{err}</FieldError>}
      {missing && <p className="text-xs text-amber-700 mt-1">Indiquez le montant.</p>}
    </li>
  );
}

/** Dashed "add" button at the bottom of a section. */
export function AddLineButton({
  onClick,
  children,
  tone = "gray",
}: {
  onClick: () => void;
  children: ReactNode;
  tone?: "rose" | "gray";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(SECONDARY_BTN, "w-full border-dashed", tone === "rose" && "text-rose-600 border-rose-200 hover:bg-rose-50")}
    >
      <Plus size={16} /> {children}
    </button>
  );
}
