"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { BrandBadge, BrandWordmark } from "@/components/gp/Brand";
import Squiggle from "@/components/gp/Squiggle";
import { BTN_PRIMARY, FIELD, FIELD_LABEL } from "@/components/admin/ui";
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
    // The one brand moment of the admin: cream menu paper on raspberry, like the home.
    <div className="min-h-dvh flex items-center justify-center bg-gp-raspberry px-3 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[400px]">
        {/* drop-shadow on the wrapper: a box-shadow would be cut by the scallop mask */}
        <div className="drop-shadow-[0_24px_30px_rgb(36_22_24_/_0.35)]">
          <div className="ga-scallop bg-gp-cream px-6 pt-12 pb-12 sm:px-10">
            <div className="flex flex-col items-center text-center">
              <BrandBadge size={84} className="shadow-gp-chip" />
              <BrandWordmark className="mt-5 w-[220px] text-gp-raspberry" />
              <p className="relative mt-3 text-xs font-medium uppercase tracking-[0.18em] text-gp-ink/70">
                Espace atelier
                <Squiggle
                  variant="squiggle"
                  delay={250}
                  duration={700}
                  strokeWidth={2}
                  className="absolute -bottom-3 left-1/2 h-2.5 w-16 -translate-x-1/2 text-gp-gold"
                />
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
              <div>
                <label htmlFor="admin-password" className={FIELD_LABEL}>
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
                    className={cn(FIELD, "min-h-12 pr-12 text-base", error && "border-red-400")}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full text-gp-ink/60 hover:text-gp-ink"
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  id="admin-login-error"
                  role="alert"
                  className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || !password} className={cn(BTN_PRIMARY, "w-full min-h-12 text-base")}>
                {loading ? <Loader2 size={17} className="animate-spin" /> : <Lock size={17} />}
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gp-cream/80 mt-5">Gateaux Patience © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
