# 09: Engineering review of the revamp (perf, a11y, RTL/i18n, SEO, code)

Branch `revamp-2026` @ a3f7497, diffed against 2353613. Tested on the running prod server
(localhost:3123). Raw evidence lives in `.shots/review-eng/` (Lighthouse JSON ×12, `axe.json`,
`menu-*.png`, `focus-*.png`, and the Playwright scripts used).

Gates: `tsc --noEmit` clean · `npm run lint` 0 errors / 19 warnings (react-hooks/immutability in
`TiramisuScene3D.tsx:226`, unused disable in `mongodb.ts:7` …) · `npm test` 9/9 · `check:i18n` OK
(18 ns × 3, 353 keys). axe-core (wcag2a/aa/21aa/22aa + best-practice): **0 violations** on
/, /galerie, detail, /tiramisu and 404, in fr + ar, phone + desktop. One H1 per page, skip link,
`<main>`, lang/dir correct, the menu `<dialog>` traps focus, Esc closes it and focus goes back to the button.

## Blockers

1. **Switching back to French from AR/EN does nothing** (`HeaderNav.tsx:65` `<NextLink href="/fr/…">`).
   A soft navigation fetches `/fr/x?_rsc=…`. next-intl answers 307 → `/x` **without `Set-Cookie`** on
   the RSC request, and `/x` then redirects back to `/ar/x` because `NEXT_LOCALE=ar`. Traced:
   `.shots/review-eng/locale-debug.mjs`. A full load works (curl `/fr/galerie` sets the cookie).
   So a French mother who taps "ع" once cannot get back to French.
   **Fix:** render the circles as a plain `<a href={switchLocaleHref(l, pathname)}>`. A locale switch
   changes `<html lang/dir>`, so it should be a document navigation anyway. Optionally also set
   `document.cookie = "NEXT_LOCALE=<l>; path=/; samesite=lax"` in `onClick`. Add a Playwright check: AR → FR → AR.

2. **Admin auth can be forged (this predates the revamp).** Every admin page and `/api/admin/*` route, plus
   `generate-description`, only checks `cookie admin_session === "authenticated"`. With
   `curl -H 'Cookie: admin_session=authenticated' -X DELETE /api/admin/cakes/<id>`, anyone can delete
   the catalogue, run seed-cakes or upload to S3.
   **Minimal fix:** add `src/lib/admin-auth.ts`.
   - `sign()` builds the token `v1.<expEpoch>.<base64url(HMAC-SHA256(ADMIN_SESSION_SECRET, "v1."+exp))>`.
   - `verify()` checks the expiry and compares with `crypto.timingSafeEqual`. If the secret is missing
     or shorter than 32 bytes, it refuses (as login already does when `ADMIN_PASSWORD` is unset).
   - Login sets the cookie HttpOnly, Secure, SameSite=Strict, path `/` (or `/admin` + `/api/admin`), 7 days.
     It compares the password with `timingSafeEqual` on SHA-256 digests.
   - One `isAdmin()` helper replaces the 12 copies of the check. Also guard `/admin` and `/api/admin` once
     in `proxy.ts` (it runs on Node in Next 16, so `node:crypto` is available). Remove them from the matcher exclusion.
   - Rotating the secret logs everyone out. That is acceptable.

## Majors

3. **The WhatsApp page link is wrapped in FSI/PDI** (`whatsapp.ts:102`, `fill(t.link, {url}, rtl)`).
   The AR message ends `…: ⁨https://…/gateau-cocomelon⁩`. Linkifiers (Android `Patterns.WEB_URL`
   accepts U+00A0–U+D7FF) can swallow U+2069 into the URL, so the owner's tap opens
   `…cocomelon%E2%81%A9` → 404. **Fix:** never isolate the URL: `fill(t.link, { url }, false)`. It
   sits alone at the end of its own line, so the bidi layout is already correct. Update the test at `whatsapp.test.ts:46`.
4. **Social/WhatsApp previews are wrong on most pages.** Root `openGraph.url` is hard-coded to `SITE_URL`,
   and `locale` is always `fr_DZ`.
   - /ar, /en and every /tiramisu page show the FRENCH og:title/description with og:url = home.
   - /galerie overrides `openGraph` and loses og:image, url and siteName.
   - Detail pages lack og:url, siteName and type, and twitter:* stays the French home copy everywhere.

   **Fix:** add a `pageMetadata({ locale, path, title, description, image? })` helper in `src/lib/seo.ts`.
   It returns `alternates` (canonical, plus fr/ar/en/x-default in one place; home currently lacks x-default)
   and `openGraph{url, locale: fr_DZ|ar_DZ|en_US, siteName, type, images (default /contact/og.jpg)}` + `twitter`.
   Use it in all 4 pages.
5. **The sitemap has no cake pages** (`sitemap.ts:5`). It is the main long-tail entry point.
   **Fix:** make `sitemap()` async. Add `getAllPublishedSlugs()` × 3 locales with alternates, and
   `lastModified: cake.updatedAt`. Use a stable date (not `new Date()`) for the static routes.
6. **A Mongo error caches a broken page under ISR** (`cakes-data.ts:22,35`, `categories-data.ts:19`).
   Errors are swallowed into `[]`/`null`. A transient DB blip at revalidation time makes /galerie
   and home render empty, and a detail page `notFound()` → the cached 404 then lasts 300 s or more.
   **Fix:** throw from the public read helpers (keep `[]` only for "no rows"). When a revalidation throws,
   Next keeps serving the last good page.
7. **Readex Latin is downloaded twice on every page** (+31.7 KB, verified in LH network records:
   `890431f0…-s.p.…woff2` and `890431f0…-s.…woff2`). `layout.tsx:112-122` declares two
   `Readex_Pro` instances. Each emits the full set of unicode-range faces (arabic, latin-ext, latin)
   under the same family, so the preloaded file and the one the CSS uses differ.
   **Fix:** delete `readexArabic`. Keep one `Readex_Pro({ subsets: ["latin"], variable: "--font-readex" })`.
   Its CSS already contains the Arabic faces. Drop `--font-readex-ar` from `globals.css:102-103`.
8. **A U+2011 on FR/EN detail pages pulls the 23 KB Readex Arabic font** (`galerie/[slug]/page.tsx:178`
   `ref.replace("-", "‑")`). U+2011 falls inside Google's arabic `unicode-range`.
   **Fix:** use `<bdi className="ltr whitespace-nowrap">` and a plain hyphen, or apply U+2011 only when `locale === "ar"`.
9. **The LCP image has no `fetchpriority`** (home and detail; LH `lcp-discovery-insight` fails).
   `LetteredBoard.tsx:138` passes `priority`. In Next 16 that preloads but emits no `fetchpriority`,
   and the image loads at **Low** priority behind 11 scripts and 3 fonts.
   **Fix:** `preload` + `fetchPriority="high"` (+ `loading="eager"`) on the `<Image>` when `image.priority`.
   This is already done right on /galerie through `preload()`.

## Minors / polish

- Dead code (knip):
  - `IntlIsland.tsx`, `MotionProvider.tsx`, `motion-features.ts`, `i18n/navigation.ts`.
  - Deps `motion`, `embla-carousel-react`, `react-intersection-observer`, `react-zoom-pan-pinch`
    (devDeps `opentype.js` and `subset-font` are only used by the scripts, keep them).
    Note that `sharp` IS used by next/image.
  - 22 unused exports, including `revalidate.ts` `CATALOG_TAG` (no `cacheTag` anywhere, so `revalidateTag` is a no-op;
    `revalidatePath("/[locale]","layout")` does the real work, which is correct).
  - 11 dead message namespaces, 116 of 353 keys: about, admin, categories, featured, footer, hero, how_to_order,
    nav, order_modal, social, stats. Delete them in all 3 locales plus `i18n/messages.ts`.
- `legacy.css`: its own deletion criterion is met (the grep over public components is empty). Delete the import at `globals.css:10`.
- Public CSS includes admin utilities: `@import "tailwindcss" source("../")` scans `src/components/admin`
  and `src/app/admin` (154 rules, ~10 KB raw). Use `source(none)` + `@source "../components/{ui,layout,home,gallery,tiramisu}"`,
  `@source "./[locale]"` and `@source "../lib"`.
- `robots.ts:44-58`: Google-Extended, anthropic-ai, CCBot and PerplexityBot groups have only `Allow: /`. A specific group
  overrides `*`, so those bots may crawl /admin and /api. Add the disallows, or drop those groups.
- `/contact` without a locale serves cookie/Accept-Language-dependent HTML from one URL. Add `Vary: Accept-Language, Cookie`
  on the rewrite response, or a CDN will pin one language.
- Product JSON-LD has no `offers`/`review`/`aggregateRating`, which Search Console flags as an invalid Product snippet.
  Either use `ImageObject`/`CreativeWork` for the photo, or accept that it is decorative.
- `TiramisuWizard.tsx:59,177-202`: hard-coded fr/ar/en strings (`t(fr, ar, en)`) for the order summary. Move them to `tiramisuUi`.
- `TiramisuWizard.tsx:825` custom `Sheet`: no focus trap, background not inert, and the inline `onClose` re-runs the
  focus effect on every parent render. Use `<dialog>.showModal()` like HeaderNav/PhotoStrip, or keep `onClose` in a ref.
- `/api/orders`: unauthenticated writes. Add a honeypot field + per-IP rate limit.
- Language circles are 32×32 with a 2 px gap (DESIGN target is 44; WCAG 2.5.8 passes). `aria-label="Français"` vs the visible "FR"
  is a label-in-name mismatch (2.5.3). Use `aria-label` = "FR, Français", or a visually-hidden suffix.
- The header and menu WhatsApp CTA on detail pages use the generic message: pass `orderHref` with the cake context from the
  detail page, or drop that CTA there.
- `NameField` `tracking-[0.02em]` is keyed off `:lang(ar)` of the page, not the typed text (`dir=auto`): an Arabic name on an FR page is letter-spaced.
- /tiramisu has no skip link or footer (by design). The lint warnings in `TiramisuScene3D.tsx` should be cleared.

## Performance (Lighthouse 13.5 mobile, simulated, median of 3)

| page | perf | FCP | LCP | TBT | CLS | LCP element |
|---|---|---|---|---|---|---|
| / | 81 | 2.44 s | 4.31 s | 83 ms | 0 | hero plate `<img>` (LetteredBoard) |
| /galerie | 78 | 2.75 s | 4.61 s | 114 ms | 0 | first card `<img>` (High prio, preloaded) |
| /galerie/gateau-cocomelon | 80 | 2.58 s | 4.31 s | 108 ms | 0 | detail plate `<img>` |
| /tiramisu | 87 | 2.14 s | 3.73 s | 73 ms | 0 | (text) |

A11y 100 everywhere. SEO 92: only `canonical` fails, because canonical is on gateauxpatience.com and the page on localhost
(artefact). BP 81: `is-on-https` (artefact).

**Claims verified.**
- The document arrives **uncompressed only under Lighthouse's Chrome**: transfer 185,576 = resource 184,808 bytes,
  and `document-latency-insight` reports "No compression applied". Static JS and CSS ARE gzipped (e.g. 72 KB / 229 KB).
  `curl --compressed` and Playwright (measure-js: html 28.2 KB) get gzip, so Kaspersky's HTML injection strips it.
  It is an environment artefact.
- Observed LCP breakdown: TTFB 20–40 ms, load delay ~10 ms, load ~18 ms, render delay ~200–230 ms.
  The 4.3 s simulated LCP is **bandwidth-bound**: at 1.6 Mbps the image competes with
  HTML 185 KB (artefact) + CSS 18 KB (2 render-blocking files, ~312 ms each) + fonts 78 KB (31.7 KB duplicate)
  + JS 160–175 KB (react-dom 72 KB + next runtime 43 KB, the framework floor). The image itself is fetched at Low priority.
- Readex was downloaded twice: confirmed (see 7).

**Fix plan, ranked (expected simulated LCP gain).**
1. Production compression (brotli/gzip at the host/CDN; verify with PageSpeed Insights on the real domain): −0.6–0.8 s. This is the artefact; no code change.
2. Dedupe Readex (7): −31.7 KB on every page, −0.15–0.2 s; AR fonts go 124 → ~93 KB.
3. `fetchPriority="high"` on the hero and detail plate (9): −0.1–0.3 s.
4. `experimental: { inlineCss: true }` in next.config: removes both render-blocking requests (LH estimates 560–740 ms). Realistic −0.3 s FCP/LCP, for +16 KB gz per HTML.
   At minimum, merge the CSS-module chunk (`3svdna…css`, 2.4 KB: HeaderNav/StickyOrderBar modules) into globals so only one request blocks.
5. Smaller CSS: delete legacy.css + Tailwind `source(none)` (above): −12–15 KB raw / ~3 KB gz.
6. Lighter HTML/RSC: the header inlines **two** 9.2 KB wordmark SVGs (stacked + inline), and both are repeated in the flight payload
   (~37 KB raw, ~8 KB gz per page; home flight is 95 KB of 184 KB).
   Render one SVG (`<symbol>` + two `<use>`) or a cached `/wordmark-*.svg` via `<img>`.
7. U+2011 (8): −23 KB on FR/EN detail pages.

Expected after 2–7 in production: home/detail ~92–95, /galerie ~90 (LCP ≈ 2.3–2.6 s simulated).
JS will stay around 160 KB gz (framework floor); `three` loads only on /tiramisu, through `dynamic()`.
