import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("[admin/login] ADMIN_PASSWORD is not set — refusing all logins.");
    return NextResponse.json(
      { error: "Service mal configuré. Contactez l'administrateur." },
      { status: 503 }
    );
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const c = await cookies();
  c.set("admin_session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const c = await cookies();
  c.delete("admin_session");
  return NextResponse.json({ ok: true });
}
