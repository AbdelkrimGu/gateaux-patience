"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CakeSlice,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  Plus,
  Tag,
  Calculator,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandBadge, BrandWordmark } from "@/components/gp/Brand";
import Squiggle from "@/components/gp/Squiggle";

const NAV = [
  { href: "/admin", label: "Tableau de bord", short: "Accueil", icon: LayoutDashboard, exact: true },
  { href: "/admin/cakes", label: "Gâteaux", short: "Gâteaux", icon: CakeSlice, exact: false },
  { href: "/admin/categories", label: "Catégories", short: "Catégories", icon: Tag, exact: false },
  { href: "/admin/orders", label: "Commandes", short: "Commandes", icon: ShoppingBag, exact: false },
  { href: "/admin/pricing", label: "Calcul des prix", short: "Prix", icon: Calculator, exact: false },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
  }

  function isActive(item: (typeof NAV)[0]) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const current = NAV.find((n) => isActive(n));

  // Shared by the computer sidebar and the phone menu.
  function sidebar(close?: () => void) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 px-5 pt-6 pb-5">
          <BrandBadge size={44} />
          <div className="min-w-0">
            <BrandWordmark className="w-[132px] text-gp-raspberry" />
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-gp-ink/65">Atelier</p>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Link
            href="/admin/cakes/new"
            onClick={close}
            className="flex w-full min-h-11 items-center justify-center gap-2 rounded-full bg-gp-raspberry text-sm font-semibold text-gp-cream shadow-gp-chip transition duration-150 hover:bg-gp-raspberry/90"
          >
            <Plus size={16} />
            Nouveau gâteau
          </Link>
        </div>

        <nav aria-label="Administration" className="flex-1 space-y-1 px-3 pb-4">
          {NAV.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition duration-150",
                  active
                    ? "bg-white font-semibold text-gp-ink shadow-gp-card ring-1 ring-gp-gold/30"
                    : "font-medium text-gp-ink/75 hover:bg-white/60 hover:text-gp-ink"
                )}
              >
                <item.icon size={18} className={active ? "text-gp-raspberry" : "text-gp-ink/60"} />
                <span className="relative">
                  {item.label}
                  {active && (
                    <Squiggle
                      variant="underline"
                      drawn
                      duration={500}
                      strokeWidth={2.5}
                      className="absolute -bottom-1.5 left-0 h-[6px] w-full text-gp-raspberry"
                    />
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-gp-gold/30 px-3 pt-3 pb-5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-gp-ink/75 transition hover:bg-white/60 hover:text-gp-ink"
          >
            <ExternalLink size={17} className="text-gp-ink/60" />
            Voir le site
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-gp-ink/75 transition hover:bg-white/60 hover:text-gp-ink"
          >
            <LogOut size={17} className="text-gp-ink/60" />
            Déconnexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-gp-cream">
      {/* Computer: paper menu on the left */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-gp-gold/30 bg-gp-champagne/40">
        {sidebar()}
      </aside>

      {/* Phone: full menu (logout, view site…) behind the top-right button */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="fixed inset-0 bg-gp-ink/50" onClick={() => setMenuOpen(false)} />
          <aside className="ga-drawer relative z-10 flex h-full w-[min(19rem,86vw)] flex-col bg-gp-cream shadow-gp-lifted">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-gp-ink/70 hover:bg-gp-ink/5"
            >
              <X size={20} />
            </button>
            {sidebar(() => setMenuOpen(false))}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex shrink-0 items-center gap-3 border-b border-gp-gold/30 bg-gp-cream/95 px-4 py-2 md:px-8 md:py-3">
          <Link href="/admin" className="md:hidden shrink-0 rounded-full" aria-label="Tableau de bord">
            <BrandBadge size={36} />
          </Link>
          <p className="min-w-0 flex-1 truncate">
            <span className="hidden md:inline text-xs font-medium uppercase tracking-[0.16em] text-gp-ink/65">
              Atelier · {current?.label || "Admin"}
            </span>
            <span className="md:hidden font-display text-lg font-semibold tracking-[-0.02em] text-gp-ink">
              {current?.label || "Admin"}
            </span>
          </p>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-gp-raspberry transition hover:bg-gp-raspberry/5"
          >
            Voir le site
            <ExternalLink size={14} />
          </a>
          <button
            type="button"
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full text-gp-ink/75 hover:bg-gp-ink/5"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
          >
            <Menu size={22} />
          </button>
        </header>

        {/* scroll-pb: a focused field is scrolled clear of sticky bottom bars (pricing result bar). */}
        <main className="flex-1 overflow-y-auto px-4 pt-5 pb-4 md:px-8 md:pt-8 md:pb-12 scroll-pb-32">{children}</main>

        {/* Phone: the five sections always one tap away, under the thumb */}
        <nav
          aria-label="Sections"
          className="md:hidden shrink-0 border-t border-gp-gold/30 bg-white pb-[env(safe-area-inset-bottom)]"
        >
          <ul className="grid grid-cols-5">
            {NAV.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-[58px] flex-col items-center justify-center gap-1 px-0.5 text-[11px] leading-none transition",
                      active ? "font-semibold text-gp-raspberry" : "font-medium text-gp-ink/70"
                    )}
                  >
                    {active && <span aria-hidden className="absolute inset-x-4 top-0 h-[3px] rounded-b-full bg-gp-raspberry" />}
                    <item.icon size={21} strokeWidth={active ? 2.2 : 1.8} />
                    <span className="whitespace-nowrap">{item.short}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
