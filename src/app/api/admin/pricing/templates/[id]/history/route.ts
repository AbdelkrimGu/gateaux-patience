import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTemplateHistory } from "@/lib/pricing-templates-data";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthed() {
  const c = await cookies();
  return verifySessionToken(c.get(ADMIN_COOKIE)?.value);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Session expirée : reconnectez-vous." }, { status: 401 });
  }
  const { id } = await params;
  try {
    return NextResponse.json(await getTemplateHistory(id));
  } catch (err) {
    console.error(`[GET /api/admin/pricing/templates/${id}/history]`, err);
    return NextResponse.json({ error: "Impossible de charger l'historique des prix" }, { status: 500 });
  }
}
