import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCakes } from "@/lib/admin-data";
import AdminShell from "@/components/admin/AdminShell";
import DeleteCakeButton from "@/components/admin/DeleteCakeButton";
import { BTN_GOLD, BTN_PRIMARY, CARD, EYEBROW, EmptyState, ICON_BTN_BASE, PageHeader, StatusPill } from "@/components/admin/ui";
import { Plus, Pencil, CakeSlice, ImageOff, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";

function Thumb({ src, size }: { src?: string; size: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden bg-gp-ink/[0.06] ring-1 ring-gp-ink/10 shrink-0 flex items-center justify-center",
        size === "md" ? "w-16 h-16" : "w-12 h-12"
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <ImageOff size={18} className="text-gp-ink/40" />
      )}
    </div>
  );
}

export default async function AdminCakesPage() {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");

  const cakes = await getCakes();

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Catalogue"
        title="Gâteaux"
        subtitle={`${cakes.length} gâteau${cakes.length !== 1 ? "x" : ""}`}
        actions={
          <Link href="/admin/cakes/new" className={BTN_GOLD}>
            <Plus size={16} />
            Nouveau gâteau
          </Link>
        }
      />
      <div className="max-w-5xl mx-auto space-y-5">
        {/* List */}
        {cakes.length === 0 ? (
          <EmptyState
            icon={<CakeSlice size={22} />}
            title="Aucun gâteau"
            action={
              <Link href="/admin/cakes/new" className={BTN_PRIMARY}>
                <Plus size={16} />
                Ajouter un gâteau
              </Link>
            }
          >
            Commencez par ajouter votre première création
          </EmptyState>
        ) : (
          <>
            {/* Mobile card list */}
            <ul className="md:hidden space-y-2.5">
              {cakes.map((cake) => (
                <li key={cake.id} className={cn(CARD, "p-2.5 flex items-center gap-2")}>
                  <Link href={`/admin/cakes/${cake.id}`} className="flex items-center gap-3 flex-1 min-w-0 rounded-xl p-0.5">
                    <Thumb src={cake.images[0]} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gp-ink truncate">
                        {cake.translations.fr.title || "Sans titre"}
                      </p>
                      <p className="text-xs text-gp-ink/70 truncate">{cake.categoryLabel.fr}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <StatusPill tone={cake.published ? "published" : "draft"}>
                          {cake.published ? "Publié" : "Brouillon"}
                        </StatusPill>
                        {cake.featured && (
                          <StatusPill tone="featured">
                            <Star size={11} /> À la une
                          </StatusPill>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center shrink-0">
                    <Link
                      href={`/admin/cakes/${cake.id}`}
                      className={cn(ICON_BTN_BASE, "hover:text-gp-raspberry hover:bg-gp-raspberry/[0.06]")}
                      title="Modifier"
                      aria-label="Modifier"
                    >
                      <Pencil size={17} />
                    </Link>
                    <DeleteCakeButton id={cake.id} />
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className={cn(CARD, "hidden md:block overflow-hidden")}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gp-ink/10 bg-gp-cream/70">
                      <th className={cn(EYEBROW, "text-left px-4 py-3 text-gp-ink/70")}>Gâteau</th>
                      <th className={cn(EYEBROW, "text-left px-4 py-3 text-gp-ink/70")}>Catégorie</th>
                      <th className={cn(EYEBROW, "text-left px-4 py-3 text-gp-ink/70")}>Statut</th>
                      <th className={cn(EYEBROW, "text-right px-4 py-3 text-gp-ink/70")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gp-ink/[0.07]">
                    {cakes.map((cake) => (
                      <tr key={cake.id} className="hover:bg-gp-ink/[0.025] transition-colors">
                        <td className="px-4 py-2.5">
                          <Link href={`/admin/cakes/${cake.id}`} className="group flex items-center gap-3 rounded-xl">
                            <Thumb src={cake.images[0]} size="sm" />
                            <div className="min-w-0">
                              <p className="font-semibold text-gp-ink truncate max-w-[260px] group-hover:text-gp-raspberry transition-colors">
                                {cake.translations.fr.title || "Sans titre"}
                              </p>
                              <p className="text-xs text-gp-ink/65">{cake.images.length} photo{cake.images.length !== 1 ? "s" : ""}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-gp-ink/80">{cake.categoryLabel.fr}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            <StatusPill tone={cake.published ? "published" : "draft"}>
                              {cake.published ? "Publié" : "Brouillon"}
                            </StatusPill>
                            {cake.featured && (
                              <StatusPill tone="featured">
                                <Star size={11} /> À la une
                              </StatusPill>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/cakes/${cake.id}`}
                              className={cn(ICON_BTN_BASE, "hover:text-gp-raspberry hover:bg-gp-raspberry/[0.06]")}
                              title="Modifier"
                              aria-label="Modifier"
                            >
                              <Pencil size={16} />
                            </Link>
                            <DeleteCakeButton id={cake.id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
