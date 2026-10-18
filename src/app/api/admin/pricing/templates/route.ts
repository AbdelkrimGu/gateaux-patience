import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createTemplate, getTemplates } from "@/lib/pricing-templates-data";
import { parseTemplateInput } from "@/lib/pricing-validation";
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
    return NextResponse.json(await getTemplates());
  } catch (err) {
    console.error("[GET /api/admin/pricing/templates]", err);
    return NextResponse.json({ error: "Impossible de charger les fiches prix" }, { status: 500 });
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
  const parsed = parseTemplateInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    // Checked against the cost library and the catalog inside createTemplate.
    const result = await createTemplate(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.template, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/pricing/templates]", err);
    return NextResponse.json({ error: "Impossible d'enregistrer cette fiche prix" }, { status: 500 });
  }
}
