import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  checkAdminPassword,
  createAdminToken,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

const MISCONFIGURED = { error: "Service mal configuré. Contactez l'administrateur." };

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { password?: unknown };

  if (!process.env.ADMIN_PASSWORD) {
    console.error("[admin/login] ADMIN_PASSWORD is not set — refusing all logins.");
    return NextResponse.json(MISCONFIGURED, { status: 503 });
  }

  if (!checkAdminPassword(body.password)) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const token = createAdminToken();
  if (!token) return NextResponse.json(MISCONFIGURED, { status: 503 });

  const c = await cookies();
  c.set(ADMIN_COOKIE, token, adminCookieOptions);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const c = await cookies();
  c.set(ADMIN_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
  return NextResponse.json({ ok: true });
}
