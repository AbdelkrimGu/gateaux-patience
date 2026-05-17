import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteCategory, updateCategory, type CategoryPatch } from "@/lib/categories-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthed() {
  const c = await cookies();
  return c.get("admin_session")?.value === "authenticated";
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: CategoryPatch;
  try {
    body = (await req.json()) as CategoryPatch;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.labels && !body.labels.fr?.trim()) {
    return NextResponse.json({ error: "FR label is required" }, { status: 400 });
  }
  try {
    const result = await updateCategory(id, body);
    if (!result.category) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error(`[PUT /api/admin/categories/${id}]`, err);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
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
  const result = await deleteCategory(id);
  if (!result.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}
