import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteTemplate, updateTemplate } from "@/lib/pricing-templates-data";
import { parseTemplateInput, pickExpectedUpdatedAt } from "@/lib/pricing-validation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthed() {
  const c = await cookies();
  return verifySessionToken(c.get(ADMIN_COOKIE)?.value);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Session expirée : reconnectez-vous." }, { status: 401 });
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const expected = pickExpectedUpdatedAt(body);
  if (!expected.ok) {
    return NextResponse.json({ error: expected.error }, { status: 400 });
  }
  // Zod whitelisting drops expectedUpdatedAt (and any `priced`) from the stored sheet.
  const parsed = parseTemplateInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const result = await updateTemplate(id, parsed.data, expected.data);
    if (!result.ok) {
      if (result.reason === "conflict") {
        return NextResponse.json(
          {
            error: "Cette fiche a été modifiée ailleurs entre-temps. Rechargez la page pour voir la dernière version.",
            conflict: true,
          },
          { status: 409 }
        );
      }
      if (result.reason === "not_found") {
        return NextResponse.json({ error: "Introuvable (déjà supprimée ?)" }, { status: 404 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.template);
  } catch (err) {
    console.error(`[PUT /api/admin/pricing/templates/${id}]`, err);
    return NextResponse.json({ error: "Impossible de modifier cette fiche prix" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Session expirée : reconnectez-vous." }, { status: 401 });
  }
  const { id } = await params;
  try {
    const ok = await deleteTemplate(id);
    if (!ok) return NextResponse.json({ error: "Introuvable (déjà supprimée ?)" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[DELETE /api/admin/pricing/templates/${id}]`, err);
    return NextResponse.json({ error: "Impossible de supprimer cette fiche prix" }, { status: 500 });
  }
}
