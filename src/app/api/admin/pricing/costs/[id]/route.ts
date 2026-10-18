import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteCostItem, updateCostItem } from "@/lib/pricing-data";
import { repriceAllTemplatesSafely } from "@/lib/pricing-templates-data";
import { pickCostItemPatch, pickExpectedUpdatedAt } from "@/lib/pricing-validation";
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
  const patch = pickCostItemPatch(body);
  const expected = pickExpectedUpdatedAt(body);
  if (!patch || !expected.ok) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  try {
    // The merged item is validated inside updateCostItem (needs the stored values).
    const result = await updateCostItem(id, patch, expected.data);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return NextResponse.json({ error: "Introuvable (déjà supprimé ?)" }, { status: 404 });
      }
      if (result.reason === "conflict") {
        return NextResponse.json(
          {
            error: "Ce coût a été modifié ailleurs entre-temps. Rechargez la page pour voir la dernière version.",
            conflict: true,
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    // Now fixed: it applies to every sheet. Variable (or fixed turned variable):
    // only the sheets using it, found through their lines and last pricing.
    await repriceAllTemplatesSafely(
      "cost",
      `[PUT /api/admin/pricing/costs/${id}]`,
      result.item.kind === "fixed" ? "all" : { costItemId: id }
    );
    return NextResponse.json(result.item);
  } catch (err) {
    console.error(`[PUT /api/admin/pricing/costs/${id}]`, err);
    return NextResponse.json({ error: "Impossible de modifier ce coût" }, { status: 500 });
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
    const ok = await deleteCostItem(id);
    if (!ok) return NextResponse.json({ error: "Introuvable (déjà supprimé ?)" }, { status: 404 });
    // Sheet lines using this cost stay (flagged in the editor and in the history).
    await repriceAllTemplatesSafely("cost", `[DELETE /api/admin/pricing/costs/${id}]`, { costItemId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[DELETE /api/admin/pricing/costs/${id}]`, err);
    return NextResponse.json({ error: "Impossible de supprimer ce coût" }, { status: 500 });
  }
}
