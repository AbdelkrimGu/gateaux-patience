# 10 — Final review: branch `revamp-2026-intent-flow`

*Reviewer: Claude (creative director + principal engineer lenses). Date: 2026-10-05. Prod server http://localhost:3123, Playwright Chromium, kaspersky blocked, POST /api/orders blocked. Evidence in `.shots/review-intent/` (scripts: `review.mjs`, `r2.mjs`–`r4.mjs`, `sheet.mjs`; base shots in `base/`).*

## Verdict

It is close to shippable. The gate reads as a maison opening, not a form: three colour-field cards with real photos, a confident display H1, the AR mirror is correct, and no fabricated content. One blocker: the 07 §7 Lighthouse bar fails (median 85 against the ≥90 target). Two majors: the desktop/menu "Commander" WhatsApp message ignores the universe, and the universe→universe transition jumps when you leave from a scrolled position.

## 07 §7 checklist

| Item | Result | Evidence |
|---|---|---|
| Home first viewport shows H1 + 3 cards fully, no CLS (390×844, 360×740, desktop; fr/ar/en) | PASS | `fv-*.png`. At 390: card bottoms fr 832, ar 823, en 832 of 844. At 360×740: all ≤ 728. Desktop: all ≤ 860 of 900. CLS 0.000 everywhere. Single H1. |
| One tap home → any universe; one tap universe → any universe | PASS | Gate cards, phone sticky strip (52px, under the header), desktop header switcher, cross-sell. All 3 RSC routes are prefetched about 1.3 s after load (LH network log). |
| Tiramisu bucket survives Tiramisu → Gâteaux → Tiramisu | PASS | `gp:tiramisu:v1` = `{step:"boxes",bucket:[small-square ×2]}`. On return, the page restores to "Étape 2 sur 5 … 2 dans le panier" (`bucket-fr-restored.png`). The "Reprendre votre tiramisu : 2 boîtes" chip (AR "تابعوا طلب التيراميسو: علبتان") shows with no card shift (`chip-*.png`). The switcher is hidden on deeper wizard steps, as the spec requires. |
| Switcher aria-current + keyboard + RTL mirror | PASS | One `aria-current="page"` visible per page. Tab order goes skip → logo → langs → menu → Gâteaux → Douceurs → Tiramisu. In AR the x positions are 253/137/20, so the order is mirrored. Arrows are mirrored. |
| /douceurs in 3 locales + sitemap + metadata + no fabrication | PASS | 3 `<loc>` in sitemap.xml. Localized title/desc, hreflang fr/ar/en/x-default. No prices. Real Cake10 photo. Message key parity is OK (universe 14, sweets 33, home 17, common 52, whatsapp 18). |
| Reduced motion = no transitions; no VT = instant | PASS (VT-off path not tested at runtime; it falls back by design) | With `reducedMotion: reduce`, `startViewTransition` is still called but no VT pseudo-element animations run, so navigation is instant. |
| Lighthouse mobile home ≥ 90 (median of 3) | **FAIL** | 84 / 85 / 85, a11y 100. LCP 3.9 s, and the LCP element is the **H1**: TTFB 0.46 s, **render delay 3.48 s**. FCP 2.3 s, TBT 70–100 ms, CLS 0. HTML is 146 KB raw / 25 KB gzip, uncompressed locally because of Kaspersky. |

## Blocker

**B1. Home LCP (the H1) waits for a late-discovered display font.** `src/app/[locale]/layout.tsx:36` sets `preload: false` on Dela Gothic One. The font is only discovered after the CSS (it lands at 196 ms in the waterfall, against 55 ms for preloaded Readex). With `display: swap`, the H1 repaints when Dela arrives, and Lighthouse counts that repaint as LCP.
- **Fix:** set `preload: true` on `dela` (14 KB Latin subset). AR pages never reference `--font-dela`, but preloading would also fetch it on AR pages. If that matters, add a locale-conditional preload instead: in `src/app/[locale]/(site)/page.tsx`, call `ReactDOM.preload(<dela woff2 url>, { as: "font", type: "font/woff2", crossOrigin: "anonymous" })` when `locale !== "ar"`.
- **Then:** re-measure. Part of the gap is the uncompressed 146 KB HTML (Kaspersky), so confirm the score on the deployed, gzip-served site before doing anything heavier.
- **Secondary (optional):** `IntentGate.tsx:38-44` ships 20 pre-formatted plural strings in the HTML and the flight payload. Compute only the 1..N actually reachable, or format client-side with a simple `one/two/few/other` table.

## Majors

**M1. The header "Commander" WhatsApp message is always "commander un gâteau personnalisé".**
- **Where:** `src/components/layout/Header.tsx:66` uses `kind: "general"` on every page. This is the desktop pill (`HeaderNav.tsx:143`) and the mobile-menu WhatsApp link (`HeaderNav.tsx:207`).
- **Effect:** on desktop /douceurs and /tiramisu, the most visible order CTA sends the wrong context. This contradicts 07 §6.
- **Fix:** in Header, build a map `{ general, cakes: kind "general", sweets: kind "sweets", tiramisu: kind "tiramisu" }` with `page` set. Pass it to HeaderNav as `orderHrefs`. In HeaderNav (it is client-side and already imports `usePathname`), pick the entry with `universeOfPath(stripLocale(pathname)) ?? "general"`.

**M2. The universe → universe transition jumps when started from a scrolled page.**
- **Evidence:** `sheet-fr-cakes-sweets.png` and `sheet-ar-sweets-tiramisu.png`, frame 0. The scroll goes from 600 to 0. The header (`gp-site-header`) and the strip (`gp-switch-bar`) are new-only with `animation: none`, so the header pops in over the old page's content. The strip drops from y=0 (stuck) to y=52 in one frame, and the indicator pill flies from y≈0 across the wordmark.
- **Fix in `src/components/universe/transitions-css.ts:33-38`:**
  - Keep `animation: none` on `::view-transition-group(gp-site-header)`.
  - Give `::view-transition-new(gp-site-header):only-child` a `gp-vt-fade-in 180ms`.
  - **Remove** `gp-switch-bar` from the `animation: none` group rule, so the group interpolates its position from the stuck top to its resting place (duration 300ms, same easing as `gp-switch-ind`). Keep `old(gp-switch-bar){display:none}`.
- **Also:** when the gate is the origin (no old strip), add `::view-transition-new(gp-switch-bar):only-child { animation: gp-vt-fade-in 200ms both; }`. Today the strip appears instantly over the gate's H1 in frame 0 (`sheet-fr-home-*.png`).

## Minor

- **m1. The tiramisu hero types its word twice on gate arrival.**
  - **Evidence:** `sheet-fr-home-tiramisu.png`. The card already shows "BRAVO". The morph lands on an empty stage, then the letters type in again (B → BR → BRAVO), which reads as a double animation.
  - **Mid-morph:** frame 1 also shows a muddy grey box, because the cocoa card crossfades into the near-black stage.
  - **Fix:** skip the stage's typing intro when arriving with a pending gate hero. For example, `landHero` sets `document.documentElement.dataset.gpArrived = "tiramisu"` and the stage reads it once. Also make `::view-transition-new(.gp-hero)` start at opacity 1 under the old image (only fade the old one out), which removes the grey midpoint.
- **m2. Contrast on /douceurs tile titles** (axe, serious): Cake pops #0a6cb5 on #dceaf6 is 4.48. Desserts #137a68 on #d6f0e9 is 4.36.
  - **Fix:** in `src/components/sweets/sweets.module.css:58`, change to `color: color-mix(in oklab, var(--piping, var(--color-framboise)) 85%, var(--color-ink));`, or darken those two piping tokens for text use.
  - All other axe runs (home fr/ar, /douceurs ar) are clean.
- **m3. Known `GalleryFilterStyles` inline script** (`src/components/gallery/GalleryFilter.tsx:225`).
  - **Production:** no console error. Client navigation to `/galerie?c=wedding` from the header applies the filter correctly (`grid data-c=wedding`, only wedding items visible; `wedding-clientnav.png`).
  - **Severity:** dev-only. This is React 19's "script tag rendered on the client is never executed" warning.
  - **Fix:** move the pre-paint `?c=` script out of the page into the root layout `<head>`, guarded by `if(/\/galerie$/.test(location.pathname))`, so it only exists in the SSR document. Keep the `<style>`.
- **m4. The desktop header switcher shows on the home page with no selection**, next to three gate cards that do the same job (`fv-fr-1440.png`).
  - **Fix:** in `Header.tsx:49-51`, render `HeaderSwitcher` only when `universeOfPath` is non-null (move the check into `HeaderSwitcher`: return `null` when `current === null`). This matches the phone, where the strip is hidden on the gate.
- **m5. The home sticky bar, the hero WhatsApp and "Écrire sur WhatsApp" all use the cake sentence** (`(site)/page.tsx:58`).
  - **Why it matters:** on the gate, which sells all three offers, a neutral sentence converts better.
  - **Fix:** add a `whatsapp.json` key `gate` ("Bonjour Gateaux Patience ! Je voudrais passer une commande." / AR / EN) and use it for the home bar.

## Polish

- **/douceurs desktop:** a large dead band between the lead and the CTA (`desk-ar_ar_douceurs-4000.png`, y 450–620). In `SweetsHero.tsx:17`, use `desk:content-center` → `desk:content-start` plus a `desk:gap-y-8`, or put the CTA row directly under the lead.
- **/douceurs "Déjà préparées pour leurs fêtes":** shows 1 card in a 2-column grid, using the **same photo as the hero**. Hide the section when it has fewer than 2 items, or exclude items whose image equals `SWEETS_HERO_IMAGE.src`.
- **AR 360 subline:** wraps to a one-word orphan ("الطلب."). Add `text-wrap: balance` on `.subline` in `gate.module.css`.
- **Switcher indicator label:** switches to the target label before it glides (frame 0, `sheet-ar-tiramisu-sweets.png`). Render `labels[current]` in the indicator and let the VT carry it, or crossfade the label.
- **Desktop gate:** card copy baselines differ between 2-line and 1-line titles (cakes vs sweets). Align with `align-content: end` on `.copy` and a fixed min-height of 2 lines on `.name`.

## Confirmed good

- WhatsApp contexts are correct for every other link on every page, decoded:
  - cake detail: "un gâteau comme « Gâteau Princesse Couronnée » (réf. GP-WU6A) … Vu ici: …/galerie/gateau-princesse-couronnee"; in AR the ref is bidi-isolated;
  - sweets tiles: per type (cupcakes / cake pops / cakesicles / desserts) with page URL, in 3 languages;
  - weddings: `?c=wedding`;
  - tiramisu: its own sentence.
- No console errors or hydration warnings on any page or client navigation (fr/ar/en).
- No physical-direction utilities in the new components.
- No uppercase or letter-spacing on Arabic.
- The AR ring text on the lettered board is connected (not letter-split).
