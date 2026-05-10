import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCakes, getOrders } from "@/lib/admin-data";
import AdminShell from "@/components/admin/AdminShell";
import { CakeSlice, ShoppingBag, Star, Eye } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "authenticated") {
    redirect("/admin/login");
  }

  const cakes = getCakes();
  const orders = getOrders();
  const newOrders = orders.filter((o) => o.status === "new");

  const stats = [
    { label: "Gâteaux publiés", value: cakes.filter((c) => c.published).length, icon: CakeSlice, color: "bg-rose-50 text-rose-500" },
    { label: "Total gâteaux", value: cakes.length, icon: Eye, color: "bg-blue-50 text-blue-500" },
    { label: "Nouvelles commandes", value: newOrders.length, icon: ShoppingBag, color: "bg-amber-50 text-amber-500" },
    { label: "Gâteaux à la une", value: cakes.filter((c) => c.featured).length, icon: Star, color: "bg-purple-50 text-purple-500" },
  ];

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Bonjour 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">Voici un aperçu de votre activité</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Dernières commandes</h2>
              <Link href="/admin/orders" className="text-xs text-rose-500 hover:text-rose-600 font-medium">
                Voir tout →
              </Link>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucune commande pour l&apos;instant</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 4).map((o) => (
                  <div key={o.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${o.status === "new" ? "bg-green-400" : o.status === "seen" ? "bg-amber-400" : "bg-gray-300"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{o.name || "Client"}</p>
                      <p className="text-xs text-gray-400 truncate">{o.cakeTitle || o.message}</p>
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      o.status === "new" ? "bg-green-100 text-green-600" :
                      o.status === "seen" ? "bg-amber-100 text-amber-600" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {o.status === "new" ? "Nouveau" : o.status === "seen" ? "Vu" : "Terminé"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Derniers gâteaux</h2>
              <Link href="/admin/cakes" className="text-xs text-rose-500 hover:text-rose-600 font-medium">
                Voir tout →
              </Link>
            </div>
            {cakes.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400 mb-3">Aucun gâteau ajouté</p>
                <Link
                  href="/admin/cakes/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition"
                >
                  + Ajouter mon premier gâteau
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {cakes.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/cakes/${c.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition group"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {c.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-700 truncate group-hover:text-rose-500 transition">
                        {c.translations.fr.title || "Sans titre"}
                      </p>
                      <p className="text-xs text-gray-400">{c.categoryLabel.fr}</p>
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${c.published ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                      {c.published ? "Publié" : "Brouillon"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
