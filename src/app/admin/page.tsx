import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCakes, getOrders } from "@/lib/admin-data";
import AdminShell from "@/components/admin/AdminShell";
import { BTN_GOLD, BTN_PRIMARY, CARD, PageHeader, StatusPill } from "@/components/admin/ui";
import { CakeSlice, ShoppingBag, Star, Eye, Plus, ArrowRight, ImageOff } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }

  const [cakes, orders] = await Promise.all([getCakes(), getOrders()]);
  const newOrders = orders.filter((o) => o.status === "new");

  const stats = [
    { label: "Nouvelles commandes", value: newOrders.length, icon: ShoppingBag, href: "/admin/orders", alert: newOrders.length > 0 },
    { label: "Gâteaux publiés", value: cakes.filter((c) => c.published).length, icon: CakeSlice, href: "/admin/cakes", alert: false },
    { label: "Total gâteaux", value: cakes.length, icon: Eye, href: "/admin/cakes", alert: false },
    { label: "Gâteaux à la une", value: cakes.filter((c) => c.featured).length, icon: Star, href: "/admin/cakes", alert: false },
  ];

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Votre atelier"
        title="Bonjour"
        subtitle="Voici un aperçu de votre activité"
        actions={
          // Computers already have it at the top of the sidebar.
          <Link href="/admin/cakes/new" className={cn(BTN_GOLD, "md:hidden")}>
            <Plus size={16} />
            Nouveau gâteau
          </Link>
        }
      />
      <div className="max-w-5xl mx-auto space-y-5 md:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className={cn(CARD, "group relative p-4 md:p-5 hover:border-gp-ink/25 transition-colors")}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-full bg-gp-champagne/70 ring-1 ring-gp-gold/50 text-gp-ink flex items-center justify-center">
                  <s.icon size={17} />
                </span>
                {s.alert && <span className="w-2.5 h-2.5 rounded-full bg-gp-raspberry" aria-hidden />}
              </div>
              <div className="font-display text-[32px] leading-none font-semibold tracking-[-0.03em] tabular-nums text-gp-ink">
                {s.value}
              </div>
              <div className="text-[13px] text-gp-ink/75 mt-1.5">{s.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Latest orders */}
          <section className={cn(CARD, "p-4 md:p-5")}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">Dernières commandes</h2>
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1 min-h-[44px] px-2 -mr-2 text-sm font-semibold text-gp-raspberry hover:underline"
              >
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-gp-ink/65 text-center py-8">Aucune commande pour l&apos;instant</p>
            ) : (
              <ul className="space-y-2">
                {orders.slice(0, 4).map((o) => (
                  <li key={o.id}>
                    <Link
                      href="/admin/orders"
                      className="flex items-center gap-3 min-h-[56px] px-3 py-2.5 rounded-xl bg-gp-cream hover:bg-gp-champagne/50 transition-colors"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          o.status === "new" ? "bg-emerald-500" : o.status === "seen" ? "bg-amber-500" : "bg-gp-ink/30"
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gp-ink truncate">{o.name || "Client"}</span>
                        <span className="block text-xs text-gp-ink/70 truncate">{o.cakeTitle || o.message}</span>
                      </span>
                      <StatusPill tone={o.status}>
                        {o.status === "new" ? "Nouveau" : o.status === "seen" ? "Vu" : "Terminé"}
                      </StatusPill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Latest cakes */}
          <section className={cn(CARD, "p-4 md:p-5")}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">Derniers gâteaux</h2>
              <Link
                href="/admin/cakes"
                className="inline-flex items-center gap-1 min-h-[44px] px-2 -mr-2 text-sm font-semibold text-gp-raspberry hover:underline"
              >
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>
            {cakes.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gp-ink/65 mb-4">Aucun gâteau ajouté</p>
                <Link href="/admin/cakes/new" className={BTN_PRIMARY}>
                  <Plus size={16} /> Ajouter mon premier gâteau
                </Link>
              </div>
            ) : (
              <ul className="space-y-1">
                {cakes.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/admin/cakes/${c.id}`}
                      className="flex items-center gap-3 min-h-[56px] p-2 rounded-xl hover:bg-gp-ink/[0.04] transition-colors group"
                    >
                      <span className="w-11 h-11 rounded-lg overflow-hidden bg-gp-ink/[0.06] shrink-0 ring-1 ring-gp-ink/10 flex items-center justify-center">
                        {c.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageOff size={16} className="text-gp-ink/40" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gp-ink truncate group-hover:text-gp-raspberry transition-colors">
                          {c.translations.fr.title || "Sans titre"}
                        </span>
                        <span className="block text-xs text-gp-ink/70">{c.categoryLabel.fr}</span>
                      </span>
                      <StatusPill tone={c.published ? "published" : "draft"}>
                        {c.published ? "Publié" : "Brouillon"}
                      </StatusPill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
