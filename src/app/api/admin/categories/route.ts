import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createCategory, getCategories, type CategoryInput } from "@/lib/categories-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthed() {
  const c = await cookies();
  return c.get("admin_session")?.value === "authenticated";
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cats = await getCategories();
  return NextResponse.json(cats);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Partial<CategoryInput>;
  try {
    body = (await req.json()) as Partial<CategoryInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.labels?.fr || body.labels.fr.trim().length === 0) {
    return NextResponse.json({ error: "FR label is required" }, { status: 400 });
  }
  try {
    const cat = await createCategory({
      labels: {
        fr: body.labels.fr,
        ar: body.labels.ar || "",
        en: body.labels.en || "",
      },
      image: typeof body.image === "string" && body.image.length > 0 ? body.image : undefined,
      order: typeof body.order === "number" ? body.order : undefined,
    });
    return NextResponse.json(cat, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/categories]", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
