"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { CheckCircle2, Eye, Trash2, Phone, MessageSquare, Clock, Inbox, RotateCcw } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/pricing/ui";
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

// Small action buttons of an order card: 44px tall, quiet until hovered.
const ACTION_BTN = cn(BTN_SECONDARY, "px-3.5 text-[13px] font-medium");

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "seen" | "done">("all");
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);

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

  // Called once she confirmed in the dialog.
  async function deleteOrder(id: string) {
    const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    if (!checkSession(res)) return;
    setOrders((prev) => prev.filter((o) => o.id !== id));
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
          subtitle={`${orders.length} demande${orders.length !== 1 ? "s" : ""} au total`}
        />

        {/* Filter tabs */}
        <div role="tablist" aria-label="Filtrer les commandes" className="flex gap-1.5 sm:gap-2 overflow-x-auto -mx-4 px-4 pb-1 md:mx-0 md:px-0">
          {(["all", "new", "seen", "done"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={(e) => {
                setFilter(f);
                // The row scrolls sideways on small phones: keep the chosen tab fully visible.
                e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
              }}
              className={cn(
                // Compact on phones so all four fit on a 390px screen.
                "inline-flex items-center gap-1.5 sm:gap-2 min-h-11 px-3 sm:px-4 rounded-full text-[13px] sm:text-sm font-medium transition whitespace-nowrap shrink-0",
                filter === f
                  ? "bg-gp-ink text-gp-cream"
                  : "bg-white text-gp-ink/80 border border-gp-ink/15 hover:border-gp-ink/30"
              )}
            >
              {f === "all" ? "Toutes" : STATUS_LABELS[f]}
              <span
                className={cn(
                  "min-w-[1.25rem] text-[11px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full tabular-nums",
                  filter === f ? "bg-gp-cream/20" : "bg-gp-ink/5"
                )}
              >
                {counts[f]}
              </span>
            </button>
          ))}
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
                <div className="flex items-start justify-between gap-x-3 gap-y-1 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span aria-hidden className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOTS[order.status])} />
                      <span className="font-display text-lg font-semibold tracking-[-0.01em] text-gp-ink">
                        {order.name || "Client anonyme"}
                      </span>
                      <StatusChip tone={STATUS_TONES[order.status]}>{STATUS_LABELS[order.status]}</StatusChip>
                    </div>
                    {order.cakeTitle && (
                      <p className="text-sm font-medium text-gp-raspberry mt-0.5">Demande pour : {order.cakeTitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gp-ink/65 tabular-nums pt-1">
                    <Clock size={12} />
                    {formatDate(order.createdAt)}
                  </div>
                </div>

                {/* Message */}
                {order.message && (
                  <p className="mt-3 text-sm text-gp-ink/85 bg-gp-cream border border-gp-gold/20 rounded-xl px-3.5 py-2.5 leading-relaxed whitespace-pre-line">
                    {order.message}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {order.phone && (
                    <>
                      <a href={`tel:${order.phone}`} className={cn(ACTION_BTN, "tabular-nums")}>
                        <Phone size={15} />
                        {order.phone}
                      </a>
                      <a
                        href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(ACTION_BTN, "border-transparent bg-emerald-700 text-white font-semibold hover:bg-emerald-800 hover:border-transparent")}
                      >
                        <MessageSquare size={15} />
                        WhatsApp
                      </a>
                    </>
                  )}

                  <div className="flex items-center gap-2 ml-auto flex-wrap">
                    {order.status !== "seen" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(order.id, "seen")}
                        className={cn(ACTION_BTN, "text-amber-800 border-amber-200 hover:bg-amber-50 hover:border-amber-300")}
                      >
                        <Eye size={15} />
                        Marquer vu
                      </button>
                    )}
                    {order.status !== "done" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(order.id, "done")}
                        className={cn(ACTION_BTN, "text-emerald-800 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300")}
                      >
                        <CheckCircle2 size={15} />
                        Terminé
                      </button>
                    )}
                    {order.status === "done" && (
                      <button type="button" onClick={() => updateStatus(order.id, "new")} className={ACTION_BTN}>
                        <RotateCcw size={15} />
                        Réouvrir
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPendingDelete(order)}
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
          confirmLabel="Supprimer"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const id = pendingDelete.id;
            setPendingDelete(null);
            void deleteOrder(id);
          }}
        >
          <p>La demande de {pendingDelete.name || "ce client"} sera supprimée de la liste.</p>
        </ConfirmDialog>
      )}
    </AdminShell>
  );
}
