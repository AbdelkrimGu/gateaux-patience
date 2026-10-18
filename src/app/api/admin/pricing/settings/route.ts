import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPricingSettings, updatePricingSettings } from "@/lib/pricing-data";
import { repriceAllTemplatesSafely } from "@/lib/pricing-templates-data";
import { parsePricingSettings } from "@/lib/pricing-validation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthed() {
  const c = await cookies();
  return verifySessionToken(c.get(ADMIN_COOKIE)?.value);
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Session expirée : reconnectez-vous." }, { status: 401 });
  }
  try {
    return NextResponse.json(await getPricingSettings());
  } catch (err) {
    console.error("[GET /api/admin/pricing/settings]", err);
    return NextResponse.json({ error: "Impossible de charger les réglages" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Session expirée : reconnectez-vous." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const parsed = parsePricingSettings(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const settings = await updatePricingSettings(parsed.data);
    await repriceAllTemplatesSafely("settings", "[PUT /api/admin/pricing/settings]");
    return NextResponse.json(settings);
  } catch (err) {
    console.error("[PUT /api/admin/pricing/settings]", err);
    return NextResponse.json({ error: "Impossible d'enregistrer les réglages" }, { status: 500 });
  }
}
