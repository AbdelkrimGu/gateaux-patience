import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createCostItem, getCostItems } from "@/lib/pricing-data";
import { repriceAllTemplatesSafely } from "@/lib/pricing-templates-data";
import { parseCostItemInput } from "@/lib/pricing-validation";
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
    return NextResponse.json(await getCostItems());
  } catch (err) {
    console.error("[GET /api/admin/pricing/costs]", err);
    return NextResponse.json({ error: "Impossible de charger les coûts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Session expirée : reconnectez-vous." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const parsed = parseCostItemInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const item = await createCostItem(parsed.data);
    // A new fixed cost applies to every price sheet; a new variable one to none yet.
    if (item.kind === "fixed") {
      await repriceAllTemplatesSafely("cost", "[POST /api/admin/pricing/costs]");
    }
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/pricing/costs]", err);
    return NextResponse.json({ error: "Impossible d'enregistrer ce coût" }, { status: 500 });
  }
}
