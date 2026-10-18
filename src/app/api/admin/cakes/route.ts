import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createCake, getCakes, type CakeInput } from "@/lib/admin-data";
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
  const cakes = await getCakes();
  return NextResponse.json(cakes);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Session expirée : reconnectez-vous." }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Partial<CakeInput>;
    if (!body?.translations?.fr?.title) {
      return NextResponse.json({ error: "Title (FR) is required" }, { status: 400 });
    }
    const cake = await createCake({
      images: Array.isArray(body.images) ? body.images : [],
      category: body.category || "daily",
      categoryLabel: body.categoryLabel || {
        fr: "Quotidien",
        ar: "يومي",
        en: "Daily",
      },
      translations: body.translations,
      length: body.length,
      width: body.width,
      height: body.height,
      pieces: body.pieces,
      persons: body.persons,
      featured: Boolean(body.featured),
      hero: Boolean(body.hero),
      published: body.published ?? true,
    });
    return NextResponse.json(cake, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/cakes]", err);
    return NextResponse.json({ error: "Failed to create cake" }, { status: 500 });
  }
}
