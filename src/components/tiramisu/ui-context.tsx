"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/tiramisu-config";

/*
  The wizard's strings arrive as a plain object from the server page
  (messages/<locale>/tiramisuUi.json), so the route ships no use-intl
  runtime and no NextIntlClientProvider. `fmt` fills {placeholders}; plurals
  are explicit `_one` / `_other` keys picked with `plural()`.
*/

export type TiramisuUi = typeof import("../../../messages/fr/tiramisuUi.json");

interface Ctx {
  locale: Locale;
  ui: TiramisuUi;
}

const TiramisuUiContext = createContext<Ctx | null>(null);

export function TiramisuUiProvider({ locale, ui, children }: Ctx & { children: React.ReactNode }) {
  return <TiramisuUiContext.Provider value={{ locale, ui }}>{children}</TiramisuUiContext.Provider>;
}

export function useTiramisuUi(): Ctx {
  const ctx = useContext(TiramisuUiContext);
  if (!ctx) throw new Error("useTiramisuUi() needs <TiramisuUiProvider>");
  return ctx;
}

export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function plural(n: number, one: string, other: string): string {
  return fmt(n === 1 ? one : other, { n });
}
