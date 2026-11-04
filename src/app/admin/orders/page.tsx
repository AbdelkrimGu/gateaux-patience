"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { CheckCircle2, Eye, Trash2, Phone, MessageSquare, Clock, Inbox, RotateCcw } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/dialogs";
import { BTN_SECONDARY, CARD, EmptyState, ICON_BUTTON_DANGER, PageHeader, StatusChip, type ChipTone } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  name: string;
  phone: string;
  message: string;
  cakeId?: string;
  cakeTitle?: string;
  status: "new" | "seen" | "done";
  createdAt: string;
}

const STATUS_LABELS = { new: "Nouveau", seen: "Vu", done: "Terminé" };
const STATUS_TONES: Record<Order["status"], ChipTone> = {
  new: "accent",
  seen: "warning",
  done: "neutral",
};
const STATUS_DOTS = {
  new: "bg-gp-raspberry",
  seen: "bg-amber-500",
  done: "bg-gp-ink/30",
};

// Action buttons of an order card: 44px tall, quiet until hovered.
// leading-tight: « Marquer terminé » may wrap to 2 lines in a half-width cell at 360px.
const ACTION_BTN = cn(BTN_SECONDARY, "px-3 sm:px-3.5 gap-1.5 text-[13px] leading-tight font-medium");

// « de Amina » → « d'Amina » (French elision before a vowel or a mute h).
function ofName(name: string): string {
  return /^[aeiouyàâäéèêëîïôöùûüh]/i.test(name) ? `d'${name}` : `de ${name}`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "seen" | "done">("all");
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Session expired: back to the login page instead of an empty list.
  function checkSession(res: Response) {
    if (res.status === 401) window.location.href = "/admin/login";
    return res.ok;
  }

  async function fetchOrders() {
    const res = await fetch("/api/admin/orders");
    if (checkSession(res)) {
      const data = await res.json();
      setOrders(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  async function updateStatus(id: string, status: Order["status"]) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!checkSession(res)) return;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  // Called once she confirmed in the dialog. A failure keeps the dialog open
  // with a message (retry or cancel) instead of closing as if it had worked.
  async function deleteOrder(id: string) {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setPendingDelete(null);
    } catch {
      setDeleteError("La suppression n'a pas abouti. Vérifiez la connexion puis réessayez.");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const counts = {
    all: orders.length,
    new: orders.filter((o) => o.status === "new").length,
    seen: orders.filter((o) => o.status === "seen").length,
    done: orders.filter((o) => o.status === "done").length,
  };

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-5">
        <PageHeader
          title="Commandes"
          // Nothing until the list is in: « 0 demandes » would be a lie while loading.
          subtitle={loading ? undefined : `${orders.length} demande${orders.length !== 1 ? "s" : ""} au total`}
        />

        {/* Filters: 4 equal chips on phones (the count sits on the chip's corner), a row on computers. */}
        <div role="group" aria-label="Filtrer les commandes" className="grid grid-cols-4 gap-1.5 pt-1.5 sm:flex sm:gap-2 sm:pt-0">
          {(["all", "new", "seen", "done"] as const).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f)}
                className={cn(
                  "relative inline-flex items-center justify-center gap-2 min-h-11 px-1 sm:px-4 rounded-full text-[13px] sm:text-sm font-medium transition whitespace-nowrap",
                  active
                    ? "bg-gp-ink text-gp-cream"
                    : "bg-white text-gp-ink/80 border border-gp-ink/15 hover:border-gp-ink/30"
                )}
              >
                {f === "all" ? "Toutes" : STATUS_LABELS[f]}
                {!loading && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-0.5 sm:static min-w-[1.25rem] h-5 px-1 sm:px-1.5 inline-flex items-center justify-center rounded-full text-[11px] sm:text-xs tabular-nums",
                      active
                        ? "bg-gp-raspberry text-gp-cream sm:bg-gp-cream/20"
                        : "bg-gp-champagne text-gp-ink ring-1 ring-gp-gold/40 sm:ring-0 sm:bg-gp-ink/5"
                    )}
                  >
                    {counts[f]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className={cn(CARD, "p-12 text-center")} role="status" aria-label="Chargement">
            <span className="ga-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox size={24} />}
            title="Aucune commande"
            text={filter === "all" ? "Vous n'avez pas encore reçu de demandes" : `Aucune commande avec le statut « ${STATUS_LABELS[filter]} »`}
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((order) => (
              <li
                key={order.id}
                className={cn(CARD, "p-4 md:p-5", order.status === "new" && "border-l-4 border-l-gp-raspberry")}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span aria-hidden className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOTS[order.status])} />
                  <span className="font-display text-lg font-semibold tracking-[-0.01em] text-gp-ink">
                    {order.name || "Client anonyme"}
                  </span>
                  <StatusChip tone={STATUS_TONES[order.status]}>{STATUS_LABELS[order.status]}</StatusChip>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gp-ink/65 tabular-nums">
                  <Clock size={12} />
                  {formatDate(order.createdAt)}
                </p>
                {order.cakeTitle && (
                  <p className="text-sm font-medium text-gp-raspberry mt-1">Demande pour : {order.cakeTitle}</p>
                )}

                {/* Message */}
                {order.message && (
                  <p className="mt-3 text-sm text-gp-ink/85 bg-gp-cream border border-gp-gold/20 rounded-xl px-3.5 py-2.5 leading-relaxed whitespace-pre-line">
                    {order.message}
                  </p>
                )}

                {/* Actions: on phones two rows of two (contact, then status + trash); one row on computers. */}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {order.phone && (
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex">
                      <a href={`tel:${order.phone}`} className={cn(ACTION_BTN, "tabular-nums")}>
                        <Phone size={15} className="shrink-0" />
                        {order.phone}
                      </a>
                      <a
                        href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(ACTION_BTN, "border-transparent bg-emerald-700 text-white font-semibold hover:bg-emerald-800 hover:border-transparent")}
                      >
                        <MessageSquare size={15} className="shrink-0" />
                        WhatsApp
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:ml-auto">
                    <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:flex-none">
                      {order.status !== "seen" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order.id, "seen")}
                          className={cn(ACTION_BTN, "text-amber-800 border-amber-200 hover:bg-amber-50 hover:border-amber-300")}
                        >
                          <Eye size={15} className="shrink-0 max-sm:hidden" />
                          Marquer vu
                        </button>
                      )}
                      {order.status !== "done" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order.id, "done")}
                          className={cn(ACTION_BTN, "text-emerald-800 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300")}
                        >
                          <CheckCircle2 size={15} className="shrink-0 max-sm:hidden" />
                          Marquer terminé
                        </button>
                      )}
                      {order.status === "done" && (
                        <button type="button" onClick={() => updateStatus(order.id, "new")} className={ACTION_BTN}>
                          <RotateCcw size={15} className="shrink-0 max-sm:hidden" />
                          Réouvrir
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDelete(order);
                      }}
                      className={ICON_BUTTON_DANGER}
                      title="Supprimer"
                      aria-label="Supprimer cette commande"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Supprimer cette commande ?"
          confirmLabel={deleteError ? "Réessayer" : "Supprimer"}
          loading={deleting}
          error={deleteError}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void deleteOrder(pendingDelete.id)}
        >
          <p>
            {pendingDelete.name
              ? `La demande ${ofName(pendingDelete.name)} sera supprimée de la liste.`
              : "Cette demande sera supprimée de la liste."}
          </p>
        </ConfirmDialog>
      )}
    </AdminShell>
  );
}
