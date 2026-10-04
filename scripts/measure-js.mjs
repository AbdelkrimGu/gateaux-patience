// JS-on-the-wire for a route, as a mid-range phone would download it.
//
//   node scripts/measure-js.mjs                    # / in fr, ar, en
//   node scripts/measure-js.mjs --routes /,/galerie --locales fr
//   node scripts/measure-js.mjs --verbose          # list every script
//
// Needs a production server: `npm run build && npx next start -p 3123`.
// `next start` gzips responses, so "wire" = gzip bytes (CDP encodedDataLength,
// headers excluded). Kaspersky's injected script is blocked (see 05 §7).

import { chromium } from "playwright";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) {
      const next = all[i + 1];
      acc.push([a.slice(2), next && !next.startsWith("--") ? next : true]);
    }
    return acc;
  }, [])
);
const BASE = String(args.base || "http://localhost:3123").replace(/\/$/, "");
const ROUTES = String(args.routes || "/")
  .split(",")
  .map((s) => s.trim().replace(/^[A-Za-z]:\/.*?\/Git(?=\/|$)/, "") || "/");
const LOCALES = String(args.locales || "fr,ar,en").split(",");

const url = (l, r) => (l === "fr" ? `${BASE}${r}` : `${BASE}/${l}${r === "/" ? "" : r}`);
const kb = (n) => (n / 1024).toFixed(1);

const browser = await chromium.launch();
for (const locale of LOCALES) {
  for (const route of ROUTES) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    await ctx.route(/kaspersky-labs\.com/, (r) => r.abort());
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    const reqs = new Map();
    cdp.on("Network.responseReceived", (e) => reqs.set(e.requestId, { url: e.response.url, type: e.type }));
    const sizes = new Map();
    cdp.on("Network.loadingFinished", (e) => sizes.set(e.requestId, e.encodedDataLength));
    await page.goto(url(locale, route), { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2500);
    let js = 0, css = 0, font = 0, img = 0, doc = 0;
    const scripts = [];
    for (const [id, r] of reqs) {
      const n = sizes.get(id) ?? 0;
      if (r.type === "Script") { js += n; scripts.push([n, r.url.replace(BASE, "")]); }
      else if (r.type === "Stylesheet") css += n;
      else if (r.type === "Font") font += n;
      else if (r.type === "Image") img += n;
      else if (r.type === "Document") doc += n;
    }
    console.log(`${locale} ${route}  JS ${kb(js)} KB  CSS ${kb(css)}  fonts ${kb(font)}  img ${kb(img)}  html ${kb(doc)}  (${scripts.length} scripts)`);
    if (args.verbose) for (const [n, u] of scripts.sort((a, b) => b[0] - a[0])) console.log(`   ${kb(n).padStart(6)}  ${u}`);
    await ctx.close();
  }
}
await browser.close();
