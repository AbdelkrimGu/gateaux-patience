// Screenshot loop for the revamp (Playwright, Chromium).
//
// Starts nothing itself: run `npm run build && npx next start -p 3123` (or
// `npm run dev -- -p 3123`) first, then:
//
//   node scripts/shoot.mjs                                # defaults below
//   node scripts/shoot.mjs --routes /,/galerie --locales fr,ar --out .shots/x
//   node scripts/shoot.mjs --reduced                      # prefers-reduced-motion
//   node scripts/shoot.mjs --tiramisu                     # also the customizer (2D + 3D)
//   node scripts/shoot.mjs --admin                        # also /admin smoke (read-only)
//
// Options
//   --base      http://localhost:3123
//   --routes    comma list. Default: /,/galerie,@detail,/tiramisu
//               `@detail` = first /galerie/<slug> link found on /galerie.
//   --locales   fr,ar,en   (fr has no prefix: localePrefix "as-needed")
//   --out       .shots/<timestamp>
//   --devices   phone,desktop
//   --reduced   emulate prefers-reduced-motion: reduce
//   --tiramisu  drive the wizard to the customizer, type a message, shoot 2D + 3D
//   --admin     log in with ADMIN_PASSWORD (env or .env.local) and visit the
//               /admin pages (read-only: nothing is saved)
//   --only-flows  skip the route shots (use with --tiramisu / --admin)
//   --help      print this help and exit
//
// Rules baked in (see research/website-revamp/05 §7): block *kaspersky-labs.com*,
// fresh browser context per locale (the NEXT_LOCALE cookie leaks), wait for
// `load` + 1500 ms (the current home never goes network-idle).

import { mkdirSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  // Print the header comment above as usage.
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const usage = src
    .split(/\r?\n/)
    .slice(0)
    .filter((l, i, all) => all.slice(0, i + 1).every((x) => x.startsWith("//")))
    .map((l) => l.replace(/^\/\/ ?/, ""))
    .join("\n");
  console.log(usage);
  process.exit(0);
}

const { chromium } = await import("playwright");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const BASE = String(args.base || "http://localhost:3123").replace(/\/$/, "");
// Git Bash rewrites "/galerie" into "C:/Program Files/Git/galerie" unless
// MSYS_NO_PATHCONV=1 is set; undo that so either way works.
const ROUTES = String(args.routes || "/,/galerie,@detail,/tiramisu")
  .split(",")
  .map((s) => s.trim().replace(/^[A-Za-z]:\/.*?\/Git(?=\/|$)/, "") || "/")
  .filter(Boolean);
const LOCALES = String(args.locales || "fr,ar,en").split(",").map((s) => s.trim()).filter(Boolean);
const OUT = resolve(String(args.out || join(".shots", stamp)));
const DEVICES_WANTED = String(args.devices || "phone,desktop").split(",");
const REDUCED = !!args.reduced;
const SETTLE_MS = 1500;

const DEVICES = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};

const localeUrl = (locale, route) => {
  const r = route.startsWith("/") ? route : `/${route}`;
  if (locale === "fr") return `${BASE}${r}`;
  return `${BASE}/${locale}${r === "/" ? "" : r}`;
};
const slugOf = (route) => (route === "/" ? "home" : route.replace(/^\/+/, "").replace(/[\/?=&]+/g, "_"));

const written = [];

async function newContext(browser, device, locale, extra = {}) {
  const ctx = await browser.newContext({
    ...DEVICES[device],
    locale: locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR",
    reducedMotion: REDUCED ? "reduce" : "no-preference",
    ...extra,
  });
  await ctx.route(/kaspersky-labs\.com/, (r) => r.abort());
  return ctx;
}

async function settle(page) {
  await page.waitForLoadState("load").catch(() => {});
  await page.waitForTimeout(SETTLE_MS);
}

async function snap(page, opts) {
  try {
    await page.screenshot({ timeout: 30000, ...opts });
  } catch {
    // Retry once with CSS animations frozen (infinite loops can stall capture).
    await page.screenshot({ timeout: 45000, animations: "disabled", ...opts });
  }
}

async function shoot(page, name) {
  const fold = join(OUT, `${name}.png`);
  const full = join(OUT, `${name}.full.png`);
  await snap(page, { path: fold });
  // Scroll through once so in-view animations fire, then back to top.
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += Math.round(window.innerHeight * 0.8)) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 200));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(600);
  await snap(page, { path: full, fullPage: true });
  written.push(fold, full);
}

async function discoverDetail(browser) {
  const ctx = await newContext(browser, "desktop", "fr");
  const page = await ctx.newPage();
  try {
    await page.goto(localeUrl("fr", "/galerie"), { waitUntil: "load", timeout: 60000 });
    const href = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a[href*="/galerie/"]')].find((x) =>
        /\/galerie\/[^/?#]+$/.test(new URL(x.href).pathname)
      );
      return a ? new URL(a.href).pathname : null;
    });
    return href ? href.replace(/^\/(fr|ar|en)(?=\/)/, "") : null;
  } finally {
    await ctx.close();
  }
}

// ---- tiramisu customizer flow -------------------------------------------
const TL = {
  fr: { custom: "Tiramisu personnalisé", add: "Ajouter", bucket: "Voir le panier", perso: "Personnaliser ce tiramisu" },
  ar: { custom: "تيراميسو مخصّص", add: "أضف", bucket: "عرض السلة", perso: "خصّص هذا التيراميسو" },
  en: { custom: "Custom tiramisu", add: "Add", bucket: "View basket", perso: "Personalize this tiramisu" },
};

async function tiramisuFlow(browser, locale) {
  const L = TL[locale] || TL.fr;
  const ctx = await newContext(browser, "phone", locale);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  try {
    await page.goto(localeUrl(locale, "/tiramisu"), { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: L.custom }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: L.add, exact: false }).first().click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: new RegExp(L.bucket) }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: L.perso }).click();
    await page.waitForTimeout(800);
    await page.locator('input[type="text"]').first().fill("PATIENCE");
    // 2D
    const btn2d = page.locator('button[aria-pressed]', { hasText: "2D" });
    if (await btn2d.count()) await btn2d.click();
    await page.waitForTimeout(2500);
    const p2 = join(OUT, `${locale}-phone-tiramisu-customizer-2d.png`);
    await page.screenshot({ path: p2 });
    written.push(p2);
    // 3D
    const btn3d = page.locator('button[aria-pressed]', { hasText: "3D" });
    if (await btn3d.count()) {
      await btn3d.click();
      await page.waitForTimeout(9000); // textures + env + first frames (SwiftShader is slow)
      const p3 = join(OUT, `${locale}-phone-tiramisu-customizer-3d.png`);
      await page.screenshot({ path: p3 });
      written.push(p3);
      const canvas = page.locator('[role="img"] canvas').first();
      if (await canvas.count()) {
        const pc = join(OUT, `${locale}-phone-tiramisu-customizer-3d.canvas.png`);
        await canvas.screenshot({ path: pc });
        written.push(pc);
      }
    } else {
      console.warn(`[${locale}] no 3D toggle (WebGL unavailable?)`);
    }
  } catch (e) {
    console.error(`[${locale}] tiramisu flow failed: ${e.message}`);
  } finally {
    if (errors.length) console.warn(`[${locale}] tiramisu page errors:\n  ` + errors.join("\n  "));
    await ctx.close();
  }
}

// ---- admin smoke (read-only) ---------------------------------------------
function adminPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  try {
    const env = readFileSync(resolve(".env.local"), "utf8");
    const m = /^ADMIN_PASSWORD\s*=\s*"?([^"\r\n]*)"?/m.exec(env);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function adminFlow(browser) {
  const password = adminPassword();
  if (!password) {
    console.warn("--admin: ADMIN_PASSWORD not found (env or .env.local); skipping the admin pages.");
  }
  for (const device of ["desktop"]) {
    const login = await newContext(browser, device, "fr");
    const lp = await login.newPage();
    const r = await lp.goto(`${BASE}/admin/login`, { waitUntil: "load", timeout: 60000 });
    await lp.waitForTimeout(800);
    const pl = join(OUT, `admin-login.png`);
    await lp.screenshot({ path: pl });
    written.push(pl);
    console.log(`admin /admin/login -> ${r?.status()}`);
    await login.close();

    if (!password) return;
    // Real login (the session cookie is signed: it can't be forged any more).
    const ctx = await newContext(browser, device, "fr");
    const page = await ctx.newPage();
    const auth = await page.request.post(`${BASE}/api/admin/login`, { data: { password } });
    console.log(`admin login -> ${auth.status()}`);
    if (!auth.ok()) {
      await ctx.close();
      return;
    }
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    const paths = ["/admin", "/admin/cakes", "/admin/cakes/new", "/admin/categories", "/admin/orders"];
    for (const p of paths) {
      const res = await page.goto(`${BASE}${p}`, { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(1200);
      const f = join(OUT, `admin${p.replace(/^\/admin/, "").replace(/\//g, "-") || "-dashboard"}.png`);
      await page.screenshot({ path: f, fullPage: true });
      written.push(f);
      console.log(`admin ${p} -> ${res?.status()} ${page.url()}`);
    }
    // Open the first existing cake's edit form (read only — nothing is saved).
    await page.goto(`${BASE}/admin/cakes`, { waitUntil: "load" });
    const edit = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a[href^="/admin/cakes/"]')].find(
        (x) => !x.getAttribute("href").endsWith("/new")
      );
      return a ? a.getAttribute("href") : null;
    });
    if (edit) {
      const res = await page.goto(`${BASE}${edit}`, { waitUntil: "load" });
      await page.waitForTimeout(1500);
      const f = join(OUT, `admin-cake-edit.png`);
      await page.screenshot({ path: f, fullPage: true });
      written.push(f);
      console.log(`admin ${edit} -> ${res?.status()}`);
    }
    if (errors.length) console.warn("admin page errors:\n  " + errors.join("\n  "));
    await ctx.close();
  }
}

// ---- main ------------------------------------------------------------------
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
try {
  if (!args["only-flows"]) {
    let routes = ROUTES;
    if (routes.includes("@detail")) {
      const d = await discoverDetail(browser).catch(() => null);
      routes = routes.flatMap((r) => (r === "@detail" ? (d ? [d] : []) : [r]));
      if (!d) console.warn("No /galerie/<slug> link found; skipping detail route.");
    }
    for (const locale of LOCALES) {
      for (const device of DEVICES_WANTED) {
        if (!DEVICES[device]) continue;
        const ctx = await newContext(browser, device, locale); // fresh per locale × device
        for (const route of routes) {
          const page = await ctx.newPage(); // fresh page per route (same cookies)
          const url = localeUrl(locale, route);
          // Detail routes are named by slug: detail-<slug>.
          const name = `${locale}-${device}-${route.startsWith("/galerie/") ? `detail-${route.split("/").pop()}` : slugOf(route)}`;
          try {
            const res = await page.goto(url, { waitUntil: "load", timeout: 60000 });
            await settle(page);
            await shoot(page, name);
            console.log(`${res?.status()} ${url}`);
          } catch (e) {
            console.error(`FAIL ${url}: ${e.message.split("\n")[0]}`);
          }
          await page.close();
        }
        await ctx.close();
      }
    }
  }
  if (args.tiramisu) for (const locale of LOCALES) await tiramisuFlow(browser, locale);
  if (args.admin) await adminFlow(browser);
} finally {
  await browser.close();
}

console.log(`\nWrote ${written.length} file(s) to ${OUT}`);
for (const f of written) console.log("  " + f);
