import { NextRequest, NextResponse } from "next/server";
import { getCakes, saveCakes, generateId, slugify, type AdminCake } from "@/lib/admin-data";

export async function GET() {
  return NextResponse.json({ cakes: getCakes() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cakes = getCakes();

  const newCake: AdminCake = {
    id: generateId(),
    slug: slugify(body.translations?.fr?.title || body.id || "gateau"),
    images: body.images || [],
    category: body.category || "daily",
    categoryLabel: body.categoryLabel || { fr: "Quotidien", ar: "يومي", en: "Daily" },
    translations: body.translations || {
      fr: { title: "", description: "" },
      ar: { title: "", description: "" },
      en: { title: "", description: "" },
    },
    length: body.length || undefined,
    width: body.width || undefined,
    height: body.height || undefined,
    pieces: body.pieces || undefined,
    persons: body.persons || undefined,
    featured: body.featured || false,
    published: body.published ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  cakes.unshift(newCake);
  saveCakes(cakes);

  return NextResponse.json({ cake: newCake }, { status: 201 });
}
