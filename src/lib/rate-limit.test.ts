import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, createRateLimiter } from "./rate-limit";

test("rate limiter: 5 per window per key, then resets", () => {
  const rl = createRateLimiter({ limit: 5, windowMs: 60_000 });
  const t0 = 1_000_000;
  for (let i = 0; i < 5; i++) assert.ok(rl.hit("a", t0 + i));
  assert.ok(!rl.hit("a", t0 + 10));
  assert.ok(rl.hit("b", t0 + 10), "other keys unaffected");
  assert.equal(rl.retryAfter("a", t0 + 30_000), 30);
  assert.ok(rl.hit("a", t0 + 60_000), "new window");
});

test("rate limiter: bounded memory", () => {
  const rl = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 10 });
  for (let i = 0; i < 100; i++) rl.hit(`ip-${i}`, 5);
  assert.ok(rl.hit("fresh", 6));
});

test("clientIp prefers the Netlify header, then x-forwarded-for", () => {
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })), "1.2.3.4");
  assert.equal(clientIp(new Headers({ "x-nf-client-connection-ip": "5.6.7.8", "x-forwarded-for": "1.2.3.4" })), "5.6.7.8");
  assert.equal(clientIp(new Headers()), "unknown");
});
