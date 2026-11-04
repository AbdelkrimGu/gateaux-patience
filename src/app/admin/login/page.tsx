"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { BrandBadge, BrandWordmark } from "@/components/gp/Brand";
import { BTN_PRIMARY, EYEBROW, INPUT, LABEL } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Erreur de connexion");
    }
    setLoading(false);
  }

  return (
    <div
      data-surface="ink"
      className="min-h-[100dvh] flex items-center justify-center bg-gp-ink text-gp-cream px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="w-full max-w-sm">
        {/* The crowned badge stamps in; the gold wordmark signs. */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <span aria-hidden className="gpa-stamp-ring absolute inset-0 rounded-full ring-2 ring-gp-gold" />
            <span className="gpa-stamp block rounded-full shadow-[0_18px_34px_-14px_rgb(0_0_0/0.7)]">
              <BrandBadge size={96} className="ring-2 ring-gp-gold" />
            </span>
          </div>
          <h1>
            <BrandWordmark className="w-[230px] text-gp-gold" label="Gateaux Patience" />
          </h1>
          <p className={cn(EYEBROW, "mt-3 text-gp-cream/70")}>Espace administration</p>
        </div>

        {/* Card */}
        <div data-surface="paper" className="bg-gp-paper text-gp-ink rounded-[28px] p-6 sm:p-8 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)]">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="w-9 h-9 rounded-full bg-gp-champagne ring-1 ring-gp-gold/60 flex items-center justify-center">
              <Lock size={16} className="text-gp-ink" />
            </span>
            <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Connexion</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="admin-password" className={LABEL}>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "admin-login-error" : undefined}
                  className={cn(INPUT, "pr-12", error && "border-red-600")}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-gp-ink/65 hover:text-gp-ink"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                id="admin-login-error"
                role="alert"
                className="flex items-start gap-2 text-sm font-medium text-red-800 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !password} className={cn(BTN_PRIMARY, "w-full min-h-[48px] text-[15px]")}>
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Lock size={16} />}
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gp-cream/60 mt-6">
          Gateaux Patience © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}