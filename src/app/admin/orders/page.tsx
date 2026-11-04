"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { CheckCircle2, Eye, Trash2, Phone, MessageSquare, Clock, Inbox, RotateCcw, Loader2 } from "lucide-react";
import { BTN_SECONDARY, CARD, EmptyState, ICON_BTN_BASE, PageHeader, StatusPill } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/dialogs";
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
const STATUS_DOT = { new: "bg-emerald-500", seen: "bg-amber-500", done: "bg-gp-ink/30" };

/** « de Karim » / « d'Amina » (French elision before a vowel or a mute h). */
function ofName(name: string): string {
  const first = name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").charAt(0).toLowerCase();
  return "aeiouyh".includes(first) ? `d'${name.trim()}` : `de ${name.trim()}`;
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

  // Always confirmed first (styled dialog); a failure keeps the dialog open with a message.
  async function deleteOrder(id: string) {
    if (deleting) return; // no double submit
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        checkSession(res);
        return;
      }
      if (!res.ok) throw new Error();
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setPendingDelete(null);
    } catch {
      setDeleteError("La suppression n'a pas abouti. Vérifiez la connexion et réessayez.");
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
      <PageHeader
        eyebrow="Atelier"
        title="Commandes"
        subtitle={loading ? "Chargement…" : `${orders.length} demande${orders.length !== 1 ? "s" : ""} au total`}
      />
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Filter tabs */}
        <div role="group" aria-label="Filtrer les commandes" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {(["all", "new", "seen", "done"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center justify-center sm:justify-start gap-2 min-h-[44px] pl-4 pr-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-150",
                filter === f
                  ? "bg-gp-ink text-gp-cream"
                  : "bg-gp-paper text-gp-ink/80 border border-gp-ink/20 hover:border-gp-ink/40"
              )}
            >
              {f === "all" ? "Toutes" : STATUS_LABELS[f]}
              <span
                className={cn(
                  "min-w-[1.5rem] text-center text-xs px-1.5 py-0.5 rounded-full tabular-nums",
                  filter === f ? "bg-gp-gold text-gp-ink" : "bg-gp-ink/[0.07] text-gp-ink/80"
                )}
              >
                {/* No zero counts before the list has arrived. */}
                {loading ? "…" : counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className={cn(CARD, "p-12 flex flex-col items-center gap-3 text-sm text-gp-ink/70")} role="status">
            <Loader2 size={26} className="animate-spin text-gp-raspberry" />
            Chargement des commandes…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Inbox size={22} />} title="Aucune commande">
            {filter === "all" ? "Vous n'avez pas encore reçu de demandes" : `Aucune commande avec le statut « ${STATUS_LABELS[filter]} »`}
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {filtered.map((order) => (
              <li key={order.id} className={cn(CARD, "p-4 md:p-5")}>
                <div className="flex items-start gap-3">
                  {/* Status dot */}
                  <span aria-hidden className={cn("hidden sm:block w-2.5 h-2.5 rounded-full mt-2 shrink-0", STATUS_DOT[order.status])} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-x-3 gap-y-1 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-[17px] font-semibold tracking-[-0.01em] text-gp-ink">
                            {order.name || "Client anonyme"}
                          </span>
                          <StatusPill tone={order.status}>{STATUS_LABELS[order.status]}</StatusPill>
                        </div>
                        {order.cakeTitle && (
                          <p className="text-sm font-medium text-gp-raspberry mt-0.5">Demande pour : {order.cakeTitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gp-ink/70 pt-1 tabular-nums">
                        <Clock size={13} />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>

                    {/* Message */}
                    {order.message && (
                      <p className="mt-3 text-sm text-gp-ink/90 bg-gp-cream border border-gp-ink/[0.06] rounded-xl px-3.5 py-2.5 leading-relaxed whitespace-pre-line">
                        {order.message}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                      {order.phone && (
                        // Wraps onto two lines on narrow phones rather than running past the card.
                        <div className="flex flex-wrap gap-2">
                          <a href={`tel:${order.phone}`} className={cn(BTN_SECONDARY, "flex-1 basis-[10rem] sm:flex-none sm:basis-auto px-4 tabular-nums break-all")}>
                            <Phone size={15} />
                            {order.phone}
                          </a>
                          <a
                            href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition-colors flex-1 basis-[8rem] sm:flex-none sm:basis-auto"
                          >
                            <MessageSquare size={15} />
                            WhatsApp
                          </a>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                        {order.status !== "seen" && (
                          <button
                            onClick={() => updateStatus(order.id, "seen")}
                            className={cn(BTN_SECONDARY, "px-3.5 flex-1 basis-[8.5rem] sm:basis-auto sm:flex-none whitespace-nowrap")}
                          >
                            <Eye size={15} className="text-amber-700" />
                            Marquer vu
                          </button>
                        )}
                        {order.status !== "done" && (
                          <button
                            onClick={() => updateStatus(order.id, "done")}
                            className={cn(BTN_SECONDARY, "px-3.5 flex-1 basis-[8.5rem] sm:basis-auto sm:flex-none whitespace-nowrap")}
                          >
                            <CheckCircle2 size={15} className="text-emerald-700" />
                            Marquer terminé
                          </button>
                        )}
                        {order.status === "done" && (
                          <button
                            onClick={() => updateStatus(order.id, "new")}
                            className={cn(BTN_SECONDARY, "px-3.5 flex-1 basis-[8.5rem] sm:basis-auto sm:flex-none whitespace-nowrap")}
                          >
                            <RotateCcw size={15} />
                            Réouvrir
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setPendingDelete(order);
                          }}
                          className={cn(ICON_BTN_BASE, "ml-auto sm:ml-0 hover:text-red-700 hover:bg-red-50")}
                          title="Supprimer"
                          aria-label={order.name.trim() ? `Supprimer la demande ${ofName(order.name)}` : "Supprimer cette demande"}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title={pendingDelete.name.trim() ? `Supprimer la demande ${ofName(pendingDelete.name)} ?` : "Supprimer cette demande ?"}
          confirmLabel="Supprimer"
          loading={deleting}
          error={deleteError}
          onConfirm={() => deleteOrder(pendingDelete.id)}
          onCancel={() => setPendingDelete(null)}
        >
          <p>Elle sera supprimée définitivement de vos commandes.</p>
        </ConfirmDialog>
      )}
    </AdminShell>
  );
}