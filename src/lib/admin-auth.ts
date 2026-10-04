// Admin session: a signed, expiring, HttpOnly cookie (replaces the forgeable
// `admin_session=authenticated`).
//
//   token = "v1.<expEpochSeconds>.<base64url(HMAC-SHA256(secret, "v1.<exp>"))>"
//
// Secret: ADMIN_SESSION_SECRET when it is set and >= 32 chars (recommended,
// set it on Netlify). Otherwise it is derived from ADMIN_PASSWORD with a fixed
// context string, so the live site keeps working without a new env variable
// (changing the password then also logs everyone out). With neither, every
// check fails closed.
//
// Node runtime only (node:crypto): API routes, server components and proxy.ts
// (Next 16 runs proxy on Node).

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

const VERSION = "v1";
const DERIVE_CONTEXT = "gateaux-patience/admin-session/v1";

let warned = false;

function sessionSecret(): Buffer | null {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length >= 32) return Buffer.from(explicit, "utf8");
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  if (!warned) {
    warned = true;
    console.warn(
      "[admin-auth] ADMIN_SESSION_SECRET is missing or shorter than 32 chars; deriving the session key from ADMIN_PASSWORD. " +
        "Set ADMIN_SESSION_SECRET (e.g. `openssl rand -base64 48`) in the hosting environment."
    );
  }
  return createHmac("sha256", password).update(DERIVE_CONTEXT).digest();
}

const b64url = (buf: Buffer) => buf.toString("base64url");

function sign(payload: string, secret: Buffer): string {
  return b64url(createHmac("sha256", secret).update(payload).digest());
}

/** New session token, or null when no secret can be resolved. */
export function createAdminToken(now = Date.now()): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const exp = Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE;
  const payload = `${VERSION}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAdminToken(token: string | undefined | null, now = Date.now()): boolean {
  if (!token) return false;
  const secret = sessionSecret();
  if (!secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION || !/^\d{1,12}$/.test(parts[1])) return false;
  const exp = Number(parts[1]);
  if (exp * 1000 <= now) return false;
  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`, secret));
  const given = Buffer.from(parts[2]);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Constant-time password check (compares SHA-256 digests). */
export function checkAdminPassword(candidate: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof candidate !== "string") return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: ADMIN_SESSION_MAX_AGE,
};

/** The one admin check for server components and route handlers. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}

/** Server components: redirect to the login page unless signed in. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}
