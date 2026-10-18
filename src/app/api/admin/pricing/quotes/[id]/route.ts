import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteQuote, updateQuote } from "@/lib/pricing-data";
import { parseQuoteInput, pickExpectedUpdatedAt } from "@/lib/pricing-validation";
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
  // Zod whitelisting drops expectedUpdatedAt from the stored quote.
  const parsed = parseQuoteInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const result = await updateQuote(id, parsed.data, expected.data);
    if (!result.ok) {
      if (result.reason === "conflict") {
        return NextResponse.json(
          {
            error: "Ce devis a été modifié ailleurs entre-temps. Rechargez la page pour voir la dernière version.",
            conflict: true,
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Introuvable (déjà supprimé ?)" }, { status: 404 });
    }
    return NextResponse.json(result.quote);
  } catch (err) {
    console.error(`[PUT /api/admin/pricing/quotes/${id}]`, err);
    return NextResponse.json({ error: "Impossible de modifier ce devis" }, { status: 500 });
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
    const ok = await deleteQuote(id);
    if (!ok) return NextResponse.json({ error: "Introuvable (déjà supprimé ?)" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[DELETE /api/admin/pricing/quotes/${id}]`, err);
    return NextResponse.json({ error: "Impossible de supprimer ce devis" }, { status: 500 });
  }
}
