import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCakes } from "@/lib/admin-data";
import AdminShell from "@/components/admin/AdminShell";
import DeleteCakeButton from "@/components/admin/DeleteCakeButton";
import { Plus, Pencil, CakeSlice } from "lucide-react";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { BTN_PRIMARY, CARD, EmptyState, ICON_BUTTON, PageHeader, StatusChip } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

function Thumb({ src, className }: { src?: string; className: string }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-xl bg-gp-champagne/50 ring-1 ring-gp-gold/25 shrink-0",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <CakeSlice size={18} className="text-gp-raspberry/60" />
      )}
    </span>
  );
}

export default async function AdminCakesPage() {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");

  const cakes = await getCakes();

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-5">
        <PageHeader
          title="Gâteaux"
          subtitle={`${cakes.length} gâteau${cakes.length !== 1 ? "x" : ""}`}
          actions={
            <Link href="/admin/cakes/new" className={BTN_PRIMARY}>
              <Plus size={16} />
              Nouveau gâteau
            </Link>
          }
        />

        {cakes.length === 0 ? (
          <EmptyState
            icon={<CakeSlice size={24} />}
            title="Aucun gâteau"
            text="Commencez par ajouter votre première création"
            action={
              <Link href="/admin/cakes/new" className={BTN_PRIMARY}>
                <Plus size={16} />
                Ajouter un gâteau
              </Link>
            }
          />
        ) : (
          <>
            {/* Phone: one card per cake */}
            <ul className="md:hidden space-y-2.5">
              {cakes.map((cake) => {
                const title = cake.translations.fr.title || "Sans titre";
                return (
                  <li key={cake.id} className={cn(CARD, "p-2.5 flex items-center gap-2")}>
                    <Link href={`/admin/cakes/${cake.id}`} className="flex items-center gap-3 flex-1 min-w-0 rounded-xl">
                      <Thumb src={cake.images[0]} className="w-16 h-16" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-snug text-gp-ink line-clamp-2">{title}</span>
                        <span className="block text-xs text-gp-ink/65 truncate mt-0.5">{cake.categoryLabel.fr}</span>
                        <StatusChip tone={cake.published ? "success" : "neutral"} className="mt-1.5">
                          {cake.published ? "Publié" : "Brouillon"}
                        </StatusChip>
                      </span>
                    </Link>
                    <div className="flex items-center shrink-0">
                      <Link
                        href={`/admin/cakes/${cake.id}`}
                        className={cn(ICON_BUTTON, "hover:text-gp-raspberry hover:bg-gp-raspberry/5")}
                        title="Modifier"
                        aria-label={`Modifier « ${title} »`}
                      >
                        <Pencil size={17} />
                      </Link>
                      <DeleteCakeButton id={cake.id} title={title} />
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Computer: table */}
            <div className={cn(CARD, "hidden md:block overflow-hidden")}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gp-gold/25 bg-gp-champagne/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gp-ink/70 uppercase tracking-[0.12em]">Gâteau</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gp-ink/70 uppercase tracking-[0.12em]">Catégorie</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gp-ink/70 uppercase tracking-[0.12em]">Statut</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gp-ink/70 uppercase tracking-[0.12em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gp-gold/20">
                  {cakes.map((cake) => {
                    const title = cake.translations.fr.title || "Sans titre";
                    return (
                      <tr key={cake.id} className="hover:bg-gp-cream/70 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/admin/cakes/${cake.id}`} className="group flex items-center gap-3 rounded-xl">
                            <Thumb src={cake.images[0]} className="w-12 h-12" />
                            <span className="min-w-0">
                              <span className="block font-semibold text-gp-ink truncate max-w-[260px] group-hover:text-gp-raspberry transition-colors">
                                {title}
                              </span>
                              <span className="block text-xs text-gp-ink/65 tabular-nums">
                                {cake.images.length} photo{cake.images.length !== 1 ? "s" : ""}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gp-ink/80">{cake.categoryLabel.fr}</td>
                        <td className="px-4 py-3">
                          <StatusChip tone={cake.published ? "success" : "neutral"}>
                            {cake.published ? "Publié" : "Brouillon"}
                          </StatusChip>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/cakes/${cake.id}`}
                              className={cn(ICON_BUTTON, "hover:text-gp-raspberry hover:bg-gp-raspberry/5")}
                              title="Modifier"
                              aria-label={`Modifier « ${title} »`}
                            >
                              <Pencil size={16} />
                            </Link>
                            <DeleteCakeButton id={cake.id} title={title} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
