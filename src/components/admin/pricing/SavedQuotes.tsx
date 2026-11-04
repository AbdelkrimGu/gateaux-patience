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
        <FileText size={28} className="mx-auto text-gp-raspberry/70 mb-2" />
        <p className="font-semibold text-gp-ink/85">Aucun devis enregistré</p>
        <p className="text-sm text-gp-ink/65 mt-1 max-w-sm mx-auto">
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
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gp-ink/65" />
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
          <p className="px-4 py-8 text-center text-sm text-gp-ink/65">Aucun devis ne correspond à {quoted(query)}.</p>
        ) : (
          <ul className="divide-y divide-gp-gold/20">
            {list.map((quote) => (
              <li key={quote.id} className="flex items-center gap-1 pr-2">
                {/* The whole card opens the devis: a big target, and the name gets the room. */}
                <button
                  type="button"
                  onClick={() => onOpen(quote)}
                  aria-label={`Ouvrir le devis ${quote.name}`}
                  className="flex-1 min-w-0 flex items-center gap-3 pl-4 pr-2 py-3 text-left rounded-xl hover:bg-gp-cream/70 transition"
                >
                  <span className="flex-1 min-w-0">
                    <span className="flex items-start gap-2 min-w-0">
                      <span className="text-sm font-medium leading-snug text-gp-ink min-w-0 line-clamp-2">{quote.name}</span>
                      {quote.id === activeQuoteId && (
                        <span className="shrink-0 text-[11px] font-medium text-gp-raspberry bg-gp-raspberry/5 rounded-full px-2 py-0.5">
                          ouvert
                        </span>
                      )}
                    </span>
                    <span className="block text-base font-bold text-gp-raspberry tabular-nums">{formatDA(quote.result.finalPrice)}</span>
                    <span className="text-xs text-gp-ink/65 flex flex-wrap items-center gap-x-2">
                      <span>{formatDate(quote.updatedAt)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {formatHours(quote.hours)}
                      </span>
                      {quote.portions ? (
                        <span className="inline-flex items-center gap-1">
                          <Users size={11} /> {formatQty(quote.portions)} {quote.portions > 1 ? "parts" : "part"}
                        </span>
                      ) : null}
                    </span>
                    {quote.note && <span className="block text-xs text-gp-ink/70 italic line-clamp-2 mt-0.5">{quote.note}</span>}
                  </span>
                  <span className="inline-flex items-center gap-1.5 shrink-0 text-sm font-medium text-gp-raspberry">
                    <FolderOpen size={16} /> <span className="hidden sm:inline">Ouvrir</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting({ quote, loading: false })}
                  className={cn(ICON_BTN, "hover:text-red-700 hover:bg-red-50")}
                  aria-label={`Supprimer le devis ${quote.name}`}
                >
                  <Trash2 size={16} />
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
