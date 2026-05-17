import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  deleteS3Object,
  getPresignedUploadUrl,
  isAllowedContentType,
  MAX_UPLOAD_BYTES,
} from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FileSpec {
  contentType: string;
  contentLength?: number;
}

async function isAuthed() {
  const c = await cookies();
  return c.get("admin_session")?.value === "authenticated";
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { id?: string; cakeId?: string; scope?: string; files?: FileSpec[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // `cakeId` is kept as an alias for backward compatibility with the cake form.
  const id = (body.id || body.cakeId || "misc").toString();
  const scope = (body.scope || "cakes").toString();
  const files = Array.isArray(body.files) ? body.files : [];
  if (files.length === 0) {
    return NextResponse.json({ error: "No files specified" }, { status: 400 });
  }
  if (files.length > 20) {
    return NextResponse.json({ error: "Too many files (max 20)" }, { status: 400 });
  }

  const uploads = await Promise.all(
    files.map(async (f) => {
      if (!f.contentType || !isAllowedContentType(f.contentType)) {
        return { error: `Unsupported type: ${f.contentType || "(none)"}` };
      }
      try {
        return await getPresignedUploadUrl({
          id,
          scope,
          contentType: f.contentType,
          contentLength: f.contentLength,
        });
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to sign URL" };
      }
    })
  );

  return NextResponse.json({ uploads, maxBytes: MAX_UPLOAD_BYTES });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }
    await deleteS3Object(url);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/upload]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
