"use client";

import { useState } from "react";
import Image from "next/image";
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
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/cakes", label: "Gâteaux", icon: CakeSlice, exact: false },
  { href: "/admin/orders", label: "Commandes", icon: ShoppingBag, exact: false },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
  }

  function isActive(item: (typeof NAV)[0]) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20 shrink-0">
          <Image
            src="/Logo/Logo-Photoroom.png"
            alt="Gateaux Patience"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="text-white font-semibold text-sm leading-tight">Gateaux Patience</div>
          <div className="text-white/50 text-xs">Administration</div>
        </div>
      </div>

      {/* Add cake shortcut */}
      <div className="px-4 py-4">
        <Link
          href="/admin/cakes/new"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-medium transition"
        >
          <Plus size={15} />
          Nouveau gâteau
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-4 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive(item)
                ? "bg-white/15 text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <item.icon size={17} />
            {item.label}
            {isActive(item) && <ChevronRight size={13} className="ml-auto" />}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-white/10 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-all w-full"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-gray-900 h-full">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-gray-900 h-full z-10">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-3 shrink-0">
          <button
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <span className="text-sm text-gray-500">
              {NAV.find((n) => isActive(n))?.label || "Admin"}
            </span>
          </div>
          <a
            href="/"
            target="_blank"
            className="text-xs text-rose-500 hover:text-rose-600 font-medium transition"
          >
            Voir le site →
          </a>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
