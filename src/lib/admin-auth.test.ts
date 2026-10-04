import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAdminPassword, createAdminToken, verifyAdminToken } from "./admin-auth";

function withEnv(env: Record<string, string | undefined>, fn: () => void) {
  const saved = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]));
  Object.assign(process.env, env);
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k];
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test("admin token: round trip, forgery, tampering, expiry", () => {
  withEnv({ ADMIN_PASSWORD: "hunter2-secret", ADMIN_SESSION_SECRET: undefined }, () => {
    const token = createAdminToken()!;
    assert.match(token, /^v1\.\d+\.[A-Za-z0-9_-]{43}$/);
    assert.ok(verifyAdminToken(token));
    // The old forgeable value and garbage are refused.
    assert.ok(!verifyAdminToken("authenticated"));
    assert.ok(!verifyAdminToken(""));
    assert.ok(!verifyAdminToken(undefined));
    // Pushing the expiry forward breaks the signature.
    const [v, exp, sig] = token.split(".");
    assert.ok(!verifyAdminToken(`${v}.${Number(exp) + 3600}.${sig}`));
    assert.ok(!verifyAdminToken(`${v}.${exp}.${sig.slice(0, -1)}A`));
    // Expired after 7 days.
    assert.ok(!verifyAdminToken(token, Date.now() + 8 * 24 * 3600 * 1000));
  });
});

test("admin token: secret rotation logs everyone out", () => {
  let token = "";
  withEnv({ ADMIN_PASSWORD: "pw-one", ADMIN_SESSION_SECRET: undefined }, () => {
    token = createAdminToken()!;
  });
  withEnv({ ADMIN_PASSWORD: "pw-two", ADMIN_SESSION_SECRET: undefined }, () => {
    assert.ok(!verifyAdminToken(token));
  });
  withEnv({ ADMIN_PASSWORD: "pw-one", ADMIN_SESSION_SECRET: "x".repeat(40) }, () => {
    assert.ok(!verifyAdminToken(token), "explicit secret replaces the derived one");
    assert.ok(verifyAdminToken(createAdminToken()));
  });
});

test("admin auth fails closed without a password", () => {
  withEnv({ ADMIN_PASSWORD: undefined, ADMIN_SESSION_SECRET: undefined }, () => {
    assert.equal(createAdminToken(), null);
    assert.ok(!checkAdminPassword(""));
  });
  withEnv({ ADMIN_PASSWORD: "pw", ADMIN_SESSION_SECRET: undefined }, () => {
    assert.ok(checkAdminPassword("pw"));
    assert.ok(!checkAdminPassword("pw "));
    assert.ok(!checkAdminPassword(undefined));
  });
});
