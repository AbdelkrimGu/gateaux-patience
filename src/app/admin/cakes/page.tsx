import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCakes } from "@/lib/admin-data";
import AdminShell from "@/components/admin/AdminShell";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default async function AdminCakesPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "authenticated") redirect("/admin/login");

  const cakes = await getCakes();

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Gâteaux</h1>
            <p className="text-sm text-gray-500">{cakes.length} gâteau{cakes.length !== 1 ? "x" : ""}</p>
          </div>
          <Link
            href="/admin/cakes/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition shadow-sm"
          >
            <Plus size={15} />
            Nouveau gâteau
          </Link>
        </div>

        {/* List */}
        {cakes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-4xl mb-3">🎂</div>
            <h2 className="font-semibold text-gray-700 mb-1">Aucun gâteau</h2>
            <p className="text-sm text-gray-400 mb-4">Commencez par ajouter votre première création</p>
            <Link
              href="/admin/cakes/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition"
            >
              <Plus size={15} />
              Ajouter un gâteau
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gâteau</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Catégorie</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cakes.map((cake) => (
                    <tr key={cake.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            {cake.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cake.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">🎂</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate max-w-[180px]">
                              {cake.translations.fr.title || "Sans titre"}
                            </p>
                            <p className="text-xs text-gray-400">{cake.images.length} photo{cake.images.length !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-600">{cake.categoryLabel.fr}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          cake.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {cake.published ? "Publié" : "Brouillon"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/cakes/${cake.id}`}
                            className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition"
                            title="Modifier"
                          >
                            <Pencil size={15} />
                          </Link>
                          <DeleteButton id={cake.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function DeleteButton({ id }: { id: string }) {
  return (
    <form action={`/api/admin/cakes/${id}`} method="post" className="inline">
      <button
        type="button"
        onClick={async () => {
          if (!confirm("Supprimer ce gâteau ?")) return;
          await fetch(`/api/admin/cakes/${id}`, { method: "DELETE" });
          window.location.reload();
        }}
        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
        title="Supprimer"
      >
        <Trash2 size={15} />
      </button>
    </form>
  );
}
