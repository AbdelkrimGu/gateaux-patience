"use client";

import { useEffect, useRef, useState } from "react";
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
import { BTN_GOLD, EYEBROW } from "./ui";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/cakes", label: "Gâteaux", icon: CakeSlice, exact: false },
  { href: "/admin/categories", label: "Catégories", icon: Tag, exact: false },
  { href: "/admin/orders", label: "Commandes", icon: ShoppingBag, exact: false },
  { href: "/admin/pricing", label: "Calcul des prix", icon: Calculator, exact: false },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Phone top bar shows the page name only once the page header has scrolled away.
  const [headerGone, setHeaderGone] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
  }

  function isActive(item: (typeof NAV)[0]) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  // Phone menu is a real modal: focus moves in, Tab stays inside, Escape closes,
  // and focus goes back to the burger. (The page never scrolls behind it: the
  // shell is a fixed-height layout and only <main> scrolls.)
  useEffect(() => {
    if (!sidebarOpen) return;
    const burger = burgerRef.current;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        return;
      }
      if (e.key !== "Tab" || !menuRef.current) return;
      const focusables = menuRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      burger?.focus();
    };
  }, [sidebarOpen]);

  const current = NAV.find((n) => isActive(n));

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <Link
        href="/admin"
        onClick={() => setSidebarOpen(false)}
        className="flex items-center gap-3 mx-3 mt-4 mb-2 px-2 py-2 rounded-2xl hover:bg-gp-cream/[0.05] transition-colors"
      >
        <BrandBadge size={44} className="ring-gp-gold" />
        <span className="min-w-0">
          <BrandWordmark className="w-[132px] text-gp-gold" />
          <span className={cn(EYEBROW, "block mt-1 text-gp-cream/60")}>Administration</span>
        </span>
      </Link>

      {/* Add cake shortcut */}
      <div className="px-4 pt-3 pb-4">
        <Link href="/admin/cakes/new" onClick={() => setSidebarOpen(false)} className={cn(BTN_GOLD, "w-full")}>
          <Plus size={16} />
          Nouveau gâteau
        </Link>
      </div>

      {/* Nav */}
      <nav aria-label="Menu principal" className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 min-h-[48px] px-3.5 rounded-xl text-[15px] font-medium transition-colors duration-150",
                active
                  ? "bg-gp-cream/[0.09] text-gp-cream"
                  : "text-gp-cream/75 hover:text-gp-cream hover:bg-gp-cream/[0.05]"
              )}
            >
              {/* Gold bar: where she is, readable without colour too (aria-current). */}
              {active && <span aria-hidden className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-gp-gold" />}
              <item.icon size={18} className={active ? "text-gp-gold" : undefined} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Site + logout */}
      <div className="px-3 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-gp-cream/10 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-3 min-h-[44px] px-3.5 rounded-xl text-sm text-gp-cream/75 hover:text-gp-cream hover:bg-gp-cream/[0.05] transition-colors"
        >
          <ExternalLink size={16} />
          Voir le site
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 min-h-[44px] px-3.5 rounded-xl text-sm text-gp-cream/75 hover:text-gp-cream hover:bg-gp-cream/[0.05] transition-colors w-full"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gp-ink">
      {/* Desktop sidebar */}
      <aside data-surface="ink" className="hidden md:flex flex-col w-60 shrink-0 h-full bg-gp-ink text-gp-cream">
        <Sidebar />
      </aside>

      {/* Phone menu */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-gp-ink/70 motion-safe:animate-gpa-fade" onClick={() => setSidebarOpen(false)} />
          <aside
            ref={menuRef}
            data-surface="ink"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="relative z-10 flex flex-col w-[84vw] max-w-[310px] h-full bg-gp-ink text-gp-cream shadow-[24px_0_48px_-24px_rgb(0_0_0/0.6)] pt-[env(safe-area-inset-top)] motion-safe:animate-gpa-drawer"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer le menu"
              className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] right-2 z-10 w-11 h-11 rounded-full flex items-center justify-center text-gp-cream/80 hover:text-gp-cream hover:bg-gp-cream/[0.08]"
            >
              <X size={20} />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Phone top bar (the desktop has the sidebar) */}
        <header
          data-surface="ink"
          className="md:hidden shrink-0 bg-gp-ink text-gp-cream pt-[env(safe-area-inset-top)]"
        >
          <div className="flex items-center gap-1 h-14 px-1.5">
            <button
              ref={burgerRef}
              className="w-11 h-11 rounded-full flex items-center justify-center text-gp-cream hover:bg-gp-cream/[0.08]"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={sidebarOpen}
            >
              <Menu size={22} />
            </button>
            <Link href="/admin" className="flex items-center gap-2 min-h-[44px] pr-2 rounded-full">
              <BrandBadge size={32} className="ring-gp-gold" />
              <BrandWordmark className="w-[112px] text-gp-gold" label="Gateaux Patience, tableau de bord" />
            </Link>
            {/* Where she is, once the page header (which says it big) has scrolled away. */}
            <span
              aria-hidden={!headerGone}
              className={cn(
                "flex-1 min-w-0 text-right pr-1 text-[13px] font-medium text-gp-cream/80 truncate transition-opacity duration-150",
                headerGone ? "opacity-100" : "opacity-0"
              )}
            >
              {current && current.href !== "/admin" ? current.label : ""}
            </span>
            <a
              href="/"
              target="_blank"
              rel="noopener"
              aria-label="Voir le site (nouvel onglet)"
              className="w-11 h-11 rounded-full flex items-center justify-center text-gp-gold hover:bg-gp-cream/[0.08]"
            >
              <ExternalLink size={19} />
            </a>
          </div>
        </header>

        {/* Content: cream paper under the ink masthead of each page. */}
        {/* scroll-pb: a focused field is scrolled clear of sticky bottom bars (pricing result bar). */}
        {/* Bottom padding on an inner box: Chrome keeps sticky bars out of the scroller's own padding. */}
        <main
          className="flex-1 overflow-y-auto bg-gp-cream px-4 md:px-8 scroll-pb-32"
          onScroll={(e) => setHeaderGone(e.currentTarget.scrollTop > 64)}
        >
          <div className="pb-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
