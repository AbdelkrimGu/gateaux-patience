/**
 * Marks the owner's devices so their visits are not counted in analytics.
 * Kept separate from analytics.ts so the admin pages don't pull in any
 * analytics code just to set the mark.
 *
 * - localStorage `gp_internal=1`: read by the browser analytics.
 * - cookie `gp_internal=1`: read by the middleware (the /contact QR page is
 *   counted server-side, where localStorage is not visible).
 */
export const INTERNAL_FLAG = "gp_internal";

export function setInternalCookie(on: boolean): void {
  try {
    document.cookie = on
      ? `${INTERNAL_FLAG}=1; path=/; max-age=31536000; samesite=lax`
      : `${INTERNAL_FLAG}=; path=/; max-age=0; samesite=lax`;
  } catch {
    // cookies blocked: nothing to do
  }
}
