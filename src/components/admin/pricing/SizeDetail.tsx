"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle, Pencil } from "lucide-react";
import type { CostItem, PriceTemplate, PricingSettings, TemplateVariant } from "@/lib/pricing-types";
import { fixedLineKey } from "@/lib/pricing-templates";
import { formatDA, formatQty, unitLabel } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { formatHours, NNBSP, priceLabel } from "./format";
import PriceBreakdown from "./PriceBreakdown";
import { blockedReason, sizeTitle, unfinishedText, type LiveSize } from "./sheet-draft";
import { CARD_CLASS, LABEL_CLASS, SECONDARY_BTN, Sheet } from "./ui";

function Section({ title, total, children }: { title: string; total?: number; children: ReactNode }) {
  return (
    <section className={CARD_CLASS}>
      <div className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-1">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {total !== undefined && (
          <span className="text-sm font-semibold text-gray-700 tabular-nums whitespace-nowrap">{formatDA(total)}</span>
        )}
      </div>
      {children}
    </section>
  );
}

function Line({
  name,
  sub,
  value,
  off = false,
  problem = false,
}: {
  name: string;
  sub?: string;
  value?: string;
  off?: boolean; // a fixed cost switched off for this size
  problem?: boolean; // the line that keeps the size from being priced
}) {
  return (
    <li className={cn("flex items-start gap-3 px-4 py-2", problem && "bg-red-50/60")}>
      {problem && <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-500" />}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium break-words", off ? "text-gray-400 line-through" : "text-gray-800")}>{name}</p>
        {sub && <p className={cn("text-xs", problem ? "text-red-700" : "text-gray-400")}>{sub}</p>}
      </div>
      {value && <span className="pt-0.5 text-sm tabular-nums text-gray-700 whitespace-nowrap">{value}</span>}
    </li>
  );
}

const EMPTY = "px-4 pb-3 text-sm text-gray-400";

/**
 * A size as it is saved, read-only: what goes in it and how its price is
 * reached. Every figure comes from `size.priced` (priceVariant with today's
 * costs) — nothing is computed here. A size without a price shows no amount
 * at all: fixed costs and hours alone would read as a (too low) price.
 */
export default function SizeDetail({
  template,
  v,
  size,
  items,
  settings,
  onEdit,
  onClose,
}: {
  template: PriceTemplate;
  v: TemplateVariant;
  size: LiveSize;
  items: CostItem[];
  settings: PricingSettings;
  onEdit: () => void;
  onClose: () => void;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  // The action that opened this sheet is gone: keep the keyboard inside it.
  useEffect(() => {
    topRef.current?.focus({ preventScroll: true });
  }, []);

  const { priced, state } = size;
  const b = priced.breakdown;
  const ok = state.kind === "ok";
  const amounts = state.kind !== "unfinished";
  const itemsById = new Map(items.map((i) => [i.id, i]));
  const lineByKey = new Map(priced.lines.map((l) => [l.key, l]));
  const costByKey = new Map(b.lines.map((l) => [l.key, l]));
  const fixed = items.filter((i) => i.kind === "fixed");
  const variable = v.lines.filter((l) => l.kind === "variable");
  const extras = v.lines.filter((l) => l.kind === "extra");

  return (
    <Sheet
      title={`${template.name} — ${sizeTitle(v)}`}
      onClose={onClose}
      footer={
        <button type="button" onClick={onEdit} className={cn(SECONDARY_BTN, "w-full min-h-[44px]")}>
          <Pencil size={15} className="shrink-0" /> Modifier cette taille
        </button>
      }
    >
      <div ref={topRef} tabIndex={-1} className="bg-gray-50 min-h-full p-4 space-y-4 outline-none">
        <section className={cn(CARD_CLASS, "p-4 space-y-3")}>
          {ok && (
            <div>
              <p className="text-2xl font-bold text-rose-600 tabular-nums leading-tight">{formatDA(b.finalPrice)}</p>
              <p className="text-xs text-gray-500">
                {b.pricePerPortion !== null && `${formatDA(b.pricePerPortion)} / part · `}
                avec vos coûts d&apos;aujourd&apos;hui
              </p>
            </div>
          )}
          {state.kind === "unfinished" && (
            <div className="rounded-xl bg-amber-50 px-3 py-3">
              <p className="text-sm font-semibold text-amber-800">À compléter{NNBSP}: {unfinishedText(v)}</p>
              <p className="text-xs text-amber-700 mt-0.5">Cette taille n&apos;a pas encore de prix.</p>
            </div>
          )}
          {state.kind === "broken" && (
            <div className="rounded-xl bg-amber-50 px-3 py-3">
              <p className="text-sm font-semibold text-amber-800">À corriger</p>
              <ul className="text-xs text-amber-700 mt-0.5 space-y-0.5">
                {state.culprits.map((c, i) => (
                  <li key={i} className="first-letter:uppercase break-words">{c}</li>
                ))}
              </ul>
              <p className="text-xs text-amber-700 mt-1">Le prix ne peut pas être calculé avant.</p>
            </div>
          )}
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className={LABEL_CLASS}>Nombre de parts</dt>
              <dd className="text-sm font-medium text-gray-800">
                {v.portions ? `${formatQty(v.portions)} ${v.portions > 1 ? "parts" : "part"}` : "Non indiqué"}
              </dd>
            </div>
            <div>
              <dt className={LABEL_CLASS}>Heures de travail</dt>
              <dd className={cn("text-sm font-medium", v.hours > 0 ? "text-gray-800" : "text-amber-700")}>
                {v.hours > 0 ? formatHours(v.hours) : "0 h"}
              </dd>
            </div>
          </dl>
          {template.note && <p className="text-xs text-gray-500 italic break-words">{template.note}</p>}
        </section>

        <Section title="Coûts variables" total={ok ? b.variableTotal : undefined}>
          {variable.length === 0 ? (
            <p className={EMPTY}>Aucun ingrédient pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {variable.map((l) => {
                const line = lineByKey.get(l.key);
                const qty = `${formatQty(l.qty)} ${unitLabel(l.qtyUnit, line?.customUnit, l.qty)}`;
                // Not in the priced lines: its cost was deleted or became a fixed cost.
                if (!line) {
                  const item = l.costItemId ? itemsById.get(l.costItemId) : undefined;
                  return (
                    <Line
                      key={l.key}
                      name={item?.name ?? l.name ?? "Un coût"}
                      sub={`${qty} · ${blockedReason(l, itemsById) ?? ""}`}
                      problem
                    />
                  );
                }
                const cost = costByKey.get(l.key);
                return (
                  <Line
                    key={l.key}
                    name={line.name}
                    sub={cost?.error ? `${qty} · ${cost.error}` : `${qty} · ${priceLabel(line)}`}
                    value={cost && !cost.error ? formatDA(cost.cost) : undefined}
                    problem={!!cost?.error}
                  />
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Extras" total={ok ? b.extrasTotal : undefined}>
          {extras.length === 0 ? (
            <p className={EMPTY}>Aucun extra.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {extras.map((l) => (
                <Line key={l.key} name={l.name} value={formatDA(costByKey.get(l.key)?.cost ?? 0)} />
              ))}
            </ul>
          )}
        </Section>

        <Section title="Coûts fixes" total={ok ? b.fixedTotal : undefined}>
          {fixed.length === 0 ? (
            <p className={EMPTY}>Aucun coût fixe dans votre liste.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {fixed.map((i) => {
                const line = lineByKey.get(fixedLineKey(i.id));
                if (!line) return <Line key={i.id} name={i.name} sub="Non compté pour cette taille" off />;
                const times = line.qty !== 1 ? ` × ${formatQty(line.qty)}` : "";
                return (
                  <Line
                    key={i.id}
                    name={i.name}
                    sub={amounts ? `${priceLabel(line)}${times}` : `Compté${times}`}
                    value={amounts ? formatDA(costByKey.get(line.key)?.cost ?? 0) : undefined}
                  />
                );
              })}
            </ul>
          )}
        </Section>

        {ok && (
          <section className={cn(CARD_CLASS, "p-4")}>
            <h3 className="font-semibold text-gray-800 mb-2">Comment le prix est obtenu</h3>
            {state.noHours && (
              <p className="text-xs font-medium text-amber-700 mb-1">0 h de travail{NNBSP}? Votre temps n&apos;est pas compté.</p>
            )}
            <PriceBreakdown breakdown={b} settings={settings} hours={v.hours} portions={v.portions} />
          </section>
        )}
      </div>
    </Sheet>
  );
}
