import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import PricingManager, { type PricingTab } from "@/components/admin/pricing/PricingManager";
import type { CakeOption } from "@/components/admin/pricing/sheet-draft";
import { getCakes } from "@/lib/admin-data";
import { getCostItems, getPricingSettings, getQuotes } from "@/lib/pricing-data";
import { getTemplates } from "@/lib/pricing-templates-data";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const TABS: readonly PricingTab[] = ["calc", "sheets", "costs", "quotes", "settings"];

type SearchParams = { tab?: string | string[] };

export default async function AdminPricingPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }
  const [items, settings, quotes, templates, allCakes] = await Promise.all([
    getCostItems(),
    getPricingSettings(),
    getQuotes(),
    getTemplates(),
    getCakes(),
  ]);
  // Only what the cake picker shows: the full cakes (all languages) stay on the server.
  const cakes: CakeOption[] = allCakes
    .map((c) => ({
      id: c.id,
      title: c.translations?.fr?.title?.trim() || c.slug,
      image: c.images?.[0] || undefined,
      published: c.published,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "fr", { sensitivity: "base", numeric: true }));
  // ?tab= wins; otherwise the price sheets when she has some (the WhatsApp
  // moment: "how much for 15 parts?"), else the calculator.
  const requested = (await searchParams)?.tab;
  const fromUrl = TABS.find((t) => t === requested);
  const initialTab: PricingTab = fromUrl ?? (templates.length > 0 ? "sheets" : "calc");
  return (
    <AdminShell>
      <PricingManager
        initialItems={items}
        initialSettings={settings}
        initialQuotes={quotes}
        initialTemplates={templates}
        cakes={cakes}
        initialTab={initialTab}
        tabFromUrl={!!fromUrl}
      />
    </AdminShell>
  );
}
