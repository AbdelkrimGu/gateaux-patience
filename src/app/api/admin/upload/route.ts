import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const cakeId = formData.get("cakeId") as string;

  if (!files.length || !cakeId) {
    return NextResponse.json({ error: "Missing files or cakeId" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", cakeId);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const savedPaths: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(bytes));
    savedPaths.push(`/uploads/${cakeId}/${filename}`);
  }

  return NextResponse.json({ paths: savedPaths });
}
