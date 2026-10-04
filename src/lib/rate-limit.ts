// Tiny in-memory fixed-window rate limiter (per server instance).
// Good enough to blunt a script hammering /api/orders; on serverless each warm
// instance keeps its own window, so treat it as a speed bump, not a quota.

export interface RateLimiter {
  /** true = allowed; false = over the limit for this window. */
  hit(key: string, now?: number): boolean;
  /** Seconds until `key`'s window resets (for Retry-After). */
  retryAfter(key: string, now?: number): number;
}

export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }: { limit: number; windowMs: number; maxKeys?: number }): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();

  function sweep(now: number) {
    for (const [k, w] of windows) if (now - w.start >= windowMs) windows.delete(k);
    // Still too many distinct keys (spoofed IPs): drop the oldest entries.
    while (windows.size > maxKeys) windows.delete(windows.keys().next().value as string);
  }

  return {
    hit(key, now = Date.now()) {
      const w = windows.get(key);
      if (!w || now - w.start >= windowMs) {
        if (windows.size >= maxKeys) sweep(now);
        windows.set(key, { start: now, count: 1 });
        return true;
      }
      w.count += 1;
      return w.count <= limit;
    },
    retryAfter(key, now = Date.now()) {
      const w = windows.get(key);
      return w ? Math.max(1, Math.ceil((w.start + windowMs - now) / 1000)) : 0;
    },
  };
}

/** Best-effort client IP behind Netlify / a proxy. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-nf-client-connection-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
