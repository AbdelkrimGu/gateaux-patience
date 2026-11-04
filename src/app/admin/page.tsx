import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCakes, getOrders } from "@/lib/admin-data";
import AdminShell from "@/components/admin/AdminShell";
import { CakeSlice, ShoppingBag, Star, Eye, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { BTN_PRIMARY, CARD, PageHeader, StatusChip } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

const ORDER_STATUS = {
  new: { label: "Nouveau", tone: "accent", dot: "bg-gp-raspberry" },
  seen: { label: "Vu", tone: "warning", dot: "bg-amber-500" },
  done: { label: "Terminé", tone: "neutral", dot: "bg-gp-ink/30" },
} as const;

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }

  const [cakes, orders] = await Promise.all([getCakes(), getOrders()]);
  const newOrders = orders.filter((o) => o.status === "new");

  const stats = [
    { label: "Gâteaux publiés", value: cakes.filter((c) => c.published).length, icon: Eye, href: "/admin/cakes" },
    { label: "Total gâteaux", value: cakes.length, icon: CakeSlice, href: "/admin/cakes" },
    { label: "Nouvelles commandes", value: newOrders.length, icon: ShoppingBag, href: "/admin/orders", highlight: newOrders.length > 0 },
    { label: "Gâteaux à la une", value: cakes.filter((c) => c.featured).length, icon: Star, href: "/admin/cakes" },
  ];

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Algiers",
  });

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader eyebrow={today} title="Bonjour" subtitle="Voici un aperçu de votre activité" />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className={cn(
                CARD,
                "group p-4 md:p-5 transition duration-150 hover:border-gp-gold/50",
                s.highlight && "border-gp-raspberry/30 bg-gp-raspberry/5"
              )}
            >
              <span className="w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-gp-champagne/70 text-gp-raspberry ring-1 ring-gp-gold/30">
                <s.icon size={18} />
              </span>
              <span className="block font-display text-[2rem] leading-none font-semibold tracking-[-0.03em] text-gp-ink tabular-nums">
                {s.value}
              </span>
              <span className="block text-[13px] text-gp-ink/70 mt-1.5">{s.label}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className={cn(CARD, "p-4 md:p-5")}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gp-ink">Dernières commandes</h2>
              <Link
                href="/admin/orders"
                className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 -mr-3 text-sm font-semibold text-gp-raspberry hover:bg-gp-raspberry/5"
              >
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-gp-ink/65 text-center py-6">Aucune commande pour l&apos;instant</p>
            ) : (
              <ul className="space-y-2">
                {orders.slice(0, 4).map((o) => {
                  const st = ORDER_STATUS[o.status] ?? ORDER_STATUS.done;
                  return (
                    <li key={o.id}>
                      <Link
                        href="/admin/orders"
                        className="flex items-center gap-3 p-3 rounded-xl bg-gp-cream hover:bg-gp-champagne/40 transition"
                      >
                        <span aria-hidden className={cn("w-2 h-2 rounded-full shrink-0", st.dot)} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-gp-ink truncate">{o.name || "Client"}</span>
                          <span className="block text-xs text-gp-ink/65 truncate">{o.cakeTitle || o.message}</span>
                        </span>
                        <StatusChip tone={st.tone}>{st.label}</StatusChip>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={cn(CARD, "p-4 md:p-5")}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gp-ink">Derniers gâteaux</h2>
              <Link
                href="/admin/cakes"
                className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 -mr-3 text-sm font-semibold text-gp-raspberry hover:bg-gp-raspberry/5"
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
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-gp-cream transition group"
                    >
                      <span className="w-12 h-12 rounded-lg overflow-hidden bg-gp-champagne/50 shrink-0 ring-1 ring-gp-gold/25">
                        {c.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-gp-ink truncate group-hover:text-gp-raspberry transition">
                          {c.translations.fr.title || "Sans titre"}
                        </span>
                        <span className="block text-xs text-gp-ink/65 truncate">{c.categoryLabel.fr}</span>
                      </span>
                      <StatusChip tone={c.published ? "success" : "neutral"}>
                        {c.published ? "Publié" : "Brouillon"}
                      </StatusChip>
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
