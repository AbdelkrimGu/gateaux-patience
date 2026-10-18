import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createQuote, getQuotes } from "@/lib/pricing-data";
import { parseQuoteInput } from "@/lib/pricing-validation";
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
    return NextResponse.json(await getQuotes());
  } catch (err) {
    console.error("[GET /api/admin/pricing/quotes]", err);
    return NextResponse.json({ error: "Impossible de charger les devis" }, { status: 500 });
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
  const parsed = parseQuoteInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const quote = await createQuote(parsed.data);
    return NextResponse.json(quote, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/pricing/quotes]", err);
    return NextResponse.json({ error: "Impossible d'enregistrer ce devis" }, { status: 500 });
  }
}
