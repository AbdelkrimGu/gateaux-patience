import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteCake, getCakeById, updateCake, type CakePatch } from "@/lib/admin-data";
import { deleteS3Objects } from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthed() {
  const c = await cookies();
  return c.get("admin_session")?.value === "authenticated";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const cake = await getCakeById(id);
  if (!cake) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cake);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getCakeById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const patch = (await req.json()) as CakePatch;
    const updated = await updateCake(id, patch);

    if (Array.isArray(patch.images)) {
      const next = new Set(patch.images);
      const removed = existing.images.filter((url) => !next.has(url));
      if (removed.length > 0) {
        await deleteS3Objects(removed);
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(`[PUT /api/admin/cakes/${id}]`, err);
    return NextResponse.json({ error: "Failed to update cake" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const deleted = await deleteCake(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (deleted.images?.length) {
    await deleteS3Objects(deleted.images);
  }
  return NextResponse.json({ ok: true });
}
