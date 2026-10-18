"use client";

import { useState } from "react";
import { Calculator, Clock, FileText, FolderOpen, Search, Trash2, Users } from "lucide-react";
import type { PriceQuote } from "@/lib/pricing-types";
import { formatDA, formatQty } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { apiJson, errorText, type ErrorInfo } from "./api";
import { formatDate, formatHours, quoted, searchKey } from "./format";
import { ApiErrorBox, CARD_CLASS, ConfirmDialog, ICON_BTN, INPUT_CLASS, PRIMARY_BTN } from "./ui";

interface Props {
  quotes: PriceQuote[];
  activeQuoteId: string | null;
  onOpen: (q: PriceQuote) => void;
  onDeleted: (id: string) => void;
  onGoToCalc: () => void;
}

export default function SavedQuotes({ quotes, activeQuoteId, onOpen, onDeleted, onGoToCalc }: Props) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [deleting, setDeleting] = useState<{ quote: PriceQuote; loading: boolean } | null>(null);

  const q = searchKey(query);
  const list = [...quotes]
    .filter((x) => !q || searchKey(`${x.name} ${x.note ?? ""}`).includes(q))
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  async function confirmDelete() {
    if (!deleting) return;
    const { quote } = deleting;
    setDeleting({ quote, loading: true });
    try {
      await apiJson<{ ok: true }>(`/api/admin/pricing/quotes/${quote.id}`, "DELETE", undefined, "La suppression a échoué.");
      onDeleted(quote.id);
      setError(null);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setDeleting(null);
    }
  }

  if (quotes.length === 0) {
    return (
      <div className={cn(CARD_CLASS, "text-center py-10 px-4")}>
        <FileText size={28} className="mx-auto text-gray-300 mb-2" />
        <p className="font-semibold text-gray-700">Aucun devis enregistré</p>
        <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
          Faites un calcul puis touchez «&nbsp;Enregistrer le devis&nbsp;» pour le retrouver ici.
        </p>
        <button type="button" onClick={onGoToCalc} className={cn(PRIMARY_BTN, "mt-4")}>
          <Calculator size={15} /> Faire un calcul
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.length > 3 && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un devis…"
            aria-label="Rechercher un devis"
            className={cn(INPUT_CLASS, "pl-9")}
          />
        </div>
      )}

      {error && <ApiErrorBox error={error} />}

      <div className={CARD_CLASS}>
        {list.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">Aucun devis ne correspond à {quoted(query)}.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {list.map((quote) => (
              <li key={quote.id} className="flex items-center gap-2 pl-4 pr-2 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium text-gray-800 min-w-0 truncate">{quote.name}</p>
                    {quote.id === activeQuoteId && (
                      <span className="shrink-0 text-[10px] font-medium text-rose-700 bg-rose-50 rounded-full px-2 py-0.5">
                        ouvert
                      </span>
                    )}
                  </div>
                  <p className="text-base font-bold text-rose-600 tabular-nums">{formatDA(quote.result.finalPrice)}</p>
                  <p className="text-xs text-gray-400 flex flex-wrap items-center gap-x-2">
                    <span>{formatDate(quote.updatedAt)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {formatHours(quote.hours)}
                    </span>
                    {quote.portions ? (
                      <span className="inline-flex items-center gap-1">
                        <Users size={11} /> {formatQty(quote.portions)} {quote.portions > 1 ? "parts" : "part"}
                      </span>
                    ) : null}
                  </p>
                  {quote.note && <p className="text-xs text-gray-500 italic truncate mt-0.5">{quote.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => onOpen(quote)}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium hover:bg-rose-100 transition shrink-0"
                >
                  <FolderOpen size={15} /> Ouvrir
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting({ quote, loading: false })}
                  className={cn(ICON_BTN, "hover:text-red-500 hover:bg-red-50")}
                  aria-label={`Supprimer le devis ${quote.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {deleting && (
        <ConfirmDialog
          title="Supprimer ce devis ?"
          confirmLabel="Supprimer"
          loading={deleting.loading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        >
          <p>{quoted(deleting.quote.name)} sera supprimé définitivement.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
