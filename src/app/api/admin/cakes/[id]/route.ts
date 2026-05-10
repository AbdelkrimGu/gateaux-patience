import { NextRequest, NextResponse } from "next/server";
import { getCakes, saveCakes, slugify } from "@/lib/admin-data";
import fs from "fs";
import path from "path";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cakes = getCakes();
  const cake = cakes.find((c) => c.id === id);
  if (!cake) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ cake });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const cakes = getCakes();
  const idx = cakes.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = {
    ...cakes[idx],
    ...body,
    id,
    slug: slugify(body.translations?.fr?.title || cakes[idx].translations.fr.title),
    updatedAt: new Date().toISOString(),
  };

  cakes[idx] = updated;
  saveCakes(cakes);
  return NextResponse.json({ cake: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cakes = getCakes();
  const cake = cakes.find((c) => c.id === id);

  if (cake) {
    // Remove uploaded images from disk
    const uploadDir = path.join(process.cwd(), "public", "uploads", id);
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true });
    }
  }

  const filtered = cakes.filter((c) => c.id !== id);
  saveCakes(filtered);
  return NextResponse.json({ ok: true });
}
