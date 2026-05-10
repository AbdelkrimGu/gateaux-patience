"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { CheckCircle2, Eye, Trash2, Phone, MessageSquare, Clock } from "lucide-react";

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
const STATUS_COLORS = {
  new: "bg-green-100 text-green-700",
  seen: "bg-amber-100 text-amber-700",
  done: "bg-gray-100 text-gray-500",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "seen" | "done">("all");

  async function fetchOrders() {
    const res = await fetch("/api/admin/orders");
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  async function updateStatus(id: string, status: Order["status"]) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  async function deleteOrder(id: string) {
    if (!confirm("Supprimer cette commande ?")) return;
    await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
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
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">Commandes</h1>
          <p className="text-sm text-gray-500">{orders.length} demande{orders.length !== 1 ? "s" : ""} au total</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "new", "seen", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? "bg-rose-500 text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {f === "all" ? "Toutes" : STATUS_LABELS[f]}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === f ? "bg-white/20" : "bg-gray-100"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="font-semibold text-gray-700 mb-1">Aucune commande</h2>
            <p className="text-sm text-gray-400">
              {filter === "all" ? "Vous n'avez pas encore reçu de demandes" : `Aucune commande avec le statut « ${STATUS_LABELS[filter]} »`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    order.status === "new" ? "bg-green-400" :
                    order.status === "seen" ? "bg-amber-400" : "bg-gray-300"
                  }`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800">{order.name || "Client anonyme"}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </div>
                        {order.cakeTitle && (
                          <p className="text-sm text-rose-500 mt-0.5">Demande pour : {order.cakeTitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock size={12} />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>

                    {/* Message */}
                    {order.message && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
                        {order.message}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {order.phone && (
                        <>
                          <a
                            href={`tel:${order.phone}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-800 transition"
                          >
                            <Phone size={12} />
                            {order.phone}
                          </a>
                          <a
                            href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition"
                          >
                            <MessageSquare size={12} />
                            WhatsApp
                          </a>
                        </>
                      )}

                      <div className="flex items-center gap-1.5 ml-auto">
                        {order.status !== "seen" && (
                          <button
                            onClick={() => updateStatus(order.id, "seen")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-amber-600 hover:bg-amber-50 border border-amber-200 transition"
                          >
                            <Eye size={12} />
                            Marquer vu
                          </button>
                        )}
                        {order.status !== "done" && (
                          <button
                            onClick={() => updateStatus(order.id, "done")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-green-600 hover:bg-green-50 border border-green-200 transition"
                          >
                            <CheckCircle2 size={12} />
                            Terminé
                          </button>
                        )}
                        {order.status === "done" && (
                          <button
                            onClick={() => updateStatus(order.id, "new")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-50 border border-gray-200 transition"
                          >
                            Réouvrir
                          </button>
                        )}
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
