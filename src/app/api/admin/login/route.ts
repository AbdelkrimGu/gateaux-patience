import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_S,
  createSessionToken,
  passwordMatches,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let password: unknown;
  try {
    ({ password } = (await req.json()) as { password?: unknown });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("[admin/login] ADMIN_PASSWORD is not set — refusing all logins.");
    return NextResponse.json(
      { error: "Service mal configuré. Contactez l'administrateur." },
      { status: 503 }
    );
  }

  if (typeof password !== "string" || !passwordMatches(password, adminPassword)) {
    // Slows down password guessing (serverless: no shared memory for a real limiter).
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const c = await cookies();
  c.set(ADMIN_COOKIE, createSessionToken()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_S,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
