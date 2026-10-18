// Admin session: the cookie holds "<expiry ms>.<HMAC-SHA256 of the expiry>",
// signed with ADMIN_SESSION_SECRET (or ADMIN_PASSWORD when unset), so it can't
// be forged by hand. Changing the signing secret logs every device out.
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30;

/** Constant-time password check (compares fixed-length digests). */
export function passwordMatches(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function secret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(`admin-session:${payload}`).digest("base64url");
}

export function createSessionToken(now = Date.now()): string | null {
  const key = secret();
  if (!key) return null;
  const expires = String(now + SESSION_MAX_AGE_S * 1000);
  return `${expires}.${sign(expires, key)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  const key = secret();
  if (!key || !token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expires = token.slice(0, dot);
  if (!/^\d{1,15}$/.test(expires) || Number(expires) < now) return false;
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(expires, key));
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** For pages and API routes: is this request from a logged-in admin? */
export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  return verifySessionToken(c.get(ADMIN_COOKIE)?.value);
}
