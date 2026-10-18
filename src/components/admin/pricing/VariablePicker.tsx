"use client";

import { useState } from "react";
import { AlertTriangle, Check, Plus, Search } from "lucide-react";
import type { CostItem } from "@/lib/pricing-types";
import { cn } from "@/lib/utils";
import { groupItems, priceLabel, quoted, searchKey } from "./format";
import { INPUT_CLASS, PRIMARY_BTN, Sheet } from "./ui";

/**
 * Picks variable costs from the library. Stays open after a pick so several
 * ingredients can be added in a row. Without `onGoToCosts` (picker opened over
 * another dialog) the empty state only explains where to add costs.
 */
export default function VariablePicker({
  items,
  usedIds,
  usedLabel = "déjà dans le calcul",
  onPick,
  onClose,
  onGoToCosts,
}: {
  items: CostItem[];
  usedIds: Set<string>;
  usedLabel?: string;
  onPick: (item: CostItem) => void;
  onClose: () => void;
  onGoToCosts?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState<Map<string, number>>(new Map());
  const q = searchKey(query);
  const filtered = q
    ? items.filter((i) => searchKey(`${i.name} ${i.group ?? ""} ${i.note ?? ""}`).includes(q))
    : items;
  const groups = groupItems(filtered);
  const addedCount = Array.from(added.values()).reduce((s, n) => s + n, 0);

  function pick(item: CostItem) {
    onPick(item);
    setAdded((m) => new Map(m).set(item.id, (m.get(item.id) ?? 0) + 1));
  }

  return (
    <Sheet
      title="Ajouter un coût variable"
      onClose={onClose}
      footer={
        items.length > 0 ? (
          <button type="button" onClick={onClose} className={cn(PRIMARY_BTN, "w-full")}>
            <Check size={15} />
            {addedCount === 0 ? "Terminé" : `Terminé (${addedCount} ajouté${addedCount > 1 ? "s" : ""})`}
          </button>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="p-6 text-center">
          <AlertTriangle size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="font-medium text-gray-700">Aucun coût variable dans votre liste</p>
          <p className="text-sm text-gray-400 mt-1">
            {onGoToCosts
              ? "Ajoutez d'abord vos ingrédients et fournitures avec leur prix."
              : "Ajoutez d'abord vos ingrédients et fournitures dans l'onglet « Mes coûts »."}
          </p>
          {onGoToCosts && (
            <button type="button" onClick={onGoToCosts} className={cn(PRIMARY_BTN, "mt-4")}>
              <Plus size={15} /> Ajouter dans Mes coûts
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="sticky top-0 bg-white px-4 pt-3 pb-2 z-10">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher (amandes, ruban…)"
                aria-label="Rechercher un coût"
                className={cn(INPUT_CLASS, "pl-9")}
              />
            </div>
          </div>
          {groups.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">Aucun résultat pour {quoted(query)}.</p>
          ) : (
            <div className="pb-3">
              {groups.map(([group, list]) => (
                <div key={group}>
                  <p className="px-5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{group}</p>
                  <ul>
                    {list.map((item) => {
                      const justAdded = added.get(item.id) ?? 0;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => pick(item)}
                            className={cn(
                              "w-full flex items-center gap-3 px-5 py-2.5 min-h-[52px] text-left hover:bg-rose-50 active:bg-rose-100 transition",
                              justAdded > 0 && "bg-emerald-50/60"
                            )}
                          >
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-medium text-gray-800 truncate">{item.name}</span>
                              <span className="block text-xs text-gray-400">{priceLabel(item)}</span>
                            </span>
                            {justAdded > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5 shrink-0">
                                <Check size={11} strokeWidth={3} /> ajouté{justAdded > 1 ? ` ×${justAdded}` : ""}
                              </span>
                            ) : usedIds.has(item.id) ? (
                              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 shrink-0">
                                {usedLabel}
                              </span>
                            ) : null}
                            <Plus size={16} className="text-rose-500 shrink-0" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
