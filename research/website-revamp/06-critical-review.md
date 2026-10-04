# 06 — Critical review of the revamp research package (01–05)

*Reviewer: principal engineer + creative director persona. Date: 2026-10-04. Scope: read 01–05 in full, checked claims against npm, primary docs and the local machine (read-only). Nothing was installed, no config was changed, and files 01–05 were not edited.*

---

## TL;DR

1. **The package is strong on facts and weak on decisions.** 05 (audit) is excellent and measured. 01 (workflow) is well sourced. 02, 03 and 04 are each good in isolation, but they **assume three different stacks and two different design philosophies**. Nobody reconciled them. Implementing them as written would produce exactly the generic site the frontend-design skill warns about, and some of 03's snippets would bring back the LCP bug that 05 measured.
2. **One tech path (decided below): upgrade first, in this order: cleanup + baseline → Next 16.3 / React 19 / R3F 9 / drei 10 / next-intl 4 / `motion` → Tailwind 4 → design system → revamp.** The deciding fact, which no file states: **Next 16 itself already requires Safari 16.4+ / Chrome 111+.** So once we take Next 16, Tailwind 4 adds no meaningful browser floor (only Firefox 111 → 128). The "TW4 is a browser risk" argument therefore belongs to the Next 16 decision, and it is small: about 88–89 % of Algerian mobile traffic is Android, whose Chrome and WebView auto-update.
3. **02's "stay on Tailwind 3 and hand-port with `framer-motion`" is withdrawn.** It made sense only under a stay-on-14 assumption. After the upgrade, 21st and shadcn code mostly drops in, which removes the per-component porting cost. 03's `next-view-transitions` workaround for Next 14 is moot. Page transitions are deferred to a later motion phase anyway.
4. **04's recommended art direction ("Maison Patience": ivory `#F7F1E8` + Cormorant Garamond + gilt hairlines + numbered sections + small-caps "N° 042 — Name — Mariage" captions + "A · B · C" eyebrow) is almost exactly calibration defaults #1, #3 and #5 in the skill.** Its paper colour is within a few RGB points of the skill's `#F4F1EA`. It must not be adopted as written. The reconciliation is to keep 04's *structure and conversion work* (most of 04's value) and re-derive the *look* through a moodboard step, sampled from her actual cakes and the copper/black logo (see §3.2).
5. **Biggest gaps:** no analytics, so we can't prove the revamp converts better. No data-model or admin plan for the features 04 requires (ref codes, "à partir de", lead time, Saison block). No DESIGN.md content. No written definition of done. No revamp-specific implementer/reviewer agent pair (only the tiramisu-3D pair exists). No owner sign-off step.
6. **Verified claims:** 9 of 10 are correct, 1 is partly wrong (the Free tier of 21st). There are also 2 factual slips: 03 says Motion "v12" when the latest is 14.0.0, and 01/02 give stale installed versions.

---

## 1. Verdict table: riskiest factual claims

| # | Claim (file) | Verdict | Evidence |
|---|---|---|---|
| 1 | Magic MCP renamed **21st MCP**, endpoint `https://21st.dev/api/mcp`, old keys reset (02) | **Verified** | README `github.com/21st-dev/magic-mcp`: "Magic MCP is now the 21st MCP", "Old Magic API keys were reset… no longer work anywhere", url `https://21st.dev/api/mcp`. `21st.dev/mcp.md`: "Formerly known as Magic MCP". |
| 2 | An API key is required even for public registry installs (02) | **Verified** | `curl https://21st.dev/r/dillionverma/blur-fade` → `{"error":"Authentication required",…}` (run today). |
| 3 | Pricing: Free 2/day, Builder $6/mo yearly or $8/mo quarterly, Builder+AI from $15 (02) | **Verified, with a caveat** | `21st.dev/pricing.md`: Builder $6 (yearly) / $8 (quarterly), AI tiers $15/$30/$60 (yearly) or $20/$40/$80 (quarterly), Team $7.50/$18.75. The Free tier says "2 free copies / day", but the page does **not** say that limit is shared across web, MCP and CLI as 02 states. 02's "Builder is the practical minimum" is a recommendation, not a fact; see §4. |
| 4 | `claude plugin install frontend-design@claude-plugins-official` (01) | **Verified** | `claude plugin marketplace list` → `claude-plugins-official` is registered. `frontend-design` is present in its `marketplace.json`, the SKILL.md is on disk, and the calibration text matches 01 word for word. `claude plugin install --help` confirms the `plugin@marketplace` syntax. `playwright`, `chrome-devtools-mcp`, `context7`, `modern-web-guidance`, `netlify-skills`, `typescript-lsp`, `figma` and `superdesign` are all present too. |
| 5 | GSAP fully free incl. SplitText/MorphSVG since 3.13 (03) | **Verified** | gsap.com/blog/3-13 (29 Apr 2025): "the entire GSAP toolset is FREE, even for commercial use". Latest is 3.15.0. |
| 6 | `next-view-transitions` works on Next 14 App Router (03) | **Verified at the package level; behaviour not tested** | npm peer `next >=14.0.0`, `react >=18.2.0 \|\| ^19`. v0.3.5 (Dec 2025). The README says only "basic use cases… with Next.js App Router". It is moot under the recommended path. |
| 7 | R3F 8 incompatible with React 19; R3F 9 requires React 19 (01) | **Verified** | npm: `@react-three/fiber@8` peer `react-dom >=18 <19`; `@9.8.1` peer `react >=19 <19.4`; drei 10 peer `react ^19` + fiber `^9`; drei 9 peer `react ^18`. Issue #3398 shows the `ReactCurrentOwner` crash. |
| 8 | Next 16.3.8 is latest; Node ≥ 20.9 (01) | **Verified** | `npm view next version` → 16.3.8; engines `>=20.9.0`; the upgrade guide reports version 16.3.8 (Node here is 24.19). |
| 9 | Tailwind 4 needs Safari 16.4+, Chrome 111+, Firefox 128+ (01) | **Verified** | tailwindcss.com/docs/compatibility. **Missing from 01:** the Next 16 upgrade guide states "Browsers: Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+", which is the same floor. |
| 10 | Motion "v12" is current; switch to `motion` (03) | **Wrong version, right advice** | `npm view motion version` → **14.0.0** (and `framer-motion` 14.0.0). The peer dependency is `react ^18 \|\| ^19`. 01 has the correct version. 03's claim of "no breaking changes 11→12" is verified by Motion's guide, but 12→14 has not been re-checked by anyone. Re-read the upgrade guide during the framework PR. |
| 11 | next-intl 4 supports Next 16 (01) | **Verified for latest only** | `next-intl@4.14.9` peer `next ^12…^16`. Early 4.x releases only listed up to `^15`, so pin `^4.14`. |
| 12 | Installed versions: Next 14.2.29, TW 3.4.14 (01); TW 3.4.19 (02) | **01 is stale** | `node_modules`: next **14.2.35**, tailwindcss **3.4.19**. 01 quoted `package.json` ranges rather than the installed versions. |
| 13 | Algerian audience is "mostly Android" (03, 04) | **Verified** | Statcounter Algeria mobile OS, Jun–Jul 2026: Android 88–89 %, iOS 11–12 %. 03's "95 %+ of our traffic is touch" is **unsourced**; the site has no analytics. |

**Local state (read-only):** `claude mcp list` shows only claude.ai connectors (Claude Docs, Google Drive, Gmail, Google Calendar). **No Playwright, Chrome DevTools, 21st or context7 MCP is installed.** `.claude/agents/` contains only `tiramisu-3d-implementer` and `tiramisu-3d-reviewer`. The repo has **no tests** and **no analytics**.

---

## 2. Contradictions and how they are resolved

### 2.1 The stack (01 vs 02 vs 03): ONE recommended path

| Question | 01 | 02 | 03 | **Resolution** |
|---|---|---|---|---|
| Next / React | Upgrade to 16 + 19 | Assumes 14 + 18 | Assumes 14 + 18 | **Upgrade** |
| Tailwind | Upgrade to 4 (optional) | Stay on 3 and port | Stay on 3 | **Upgrade to 4** |
| Animation package | `motion` | Keep `framer-motion` and rewrite imports *to* it | `motion` | **`motion`.** 21st code then imports `motion/react` unchanged. |
| shadcn | `shadcn init` on TW4 | Never run init; hand-made `components.json` with `shadcn@2.3.0` | — | **Hand-written `components.json` on TW4.** Adopt shadcn's *semantic variable names* as our token contract (below). |
| Page transitions | React 19.2 `<ViewTransition>` | — | `next-view-transitions` | **Deferred** to motion phase 2. Then use React `<ViewTransition>` if `experimental.viewTransition` is still acceptable, otherwise `next-view-transitions` (it supports React 19). |

**Why upgrade, and why now:**
- **The 3D tiramisu is cheap to migrate.** The R3F surface is `Canvas`, `useFrame`, `useThree`, `invalidate` plus drei `OrbitControls`, `ContactShadows`, `Environment` and `Lightformer`, across 3 files. Use the existing tiramisu-3d agent pair.
- **The admin is low risk.** `params` is already awaited, and there is no custom webpack config (checked `next.config.mjs`), so the Turbopack-default build won't fail on that.
- **Doing it later means doing the work twice.** The revamp needs ISR / `revalidateTag` (04/05 P0). The Next 16 signature is `revalidateTag(tag, 'max')`, so writing it on 14 means rewriting it.
- **The browser floor is acceptable.** Next 16 sets Safari 16.4+ / Chrome 111+ on its own. Android Chrome and WebView auto-update, and Chrome ≥ 111 runs on Android 7+. The real exposure is iPhones stuck on iOS ≤ 16.3 (iPhone 7 and older, plus non-updaters). That is a slice of 11–12 % iOS share, probably ≤ 1–2 % of total traffic (**estimate, not measured**). Tailwind 4 adds nothing material on top.
- **The ecosystem has moved on.** shadcn's current docs, Magic UI, coss ui and most 21st items are TW4 + React 19-first. Staying on TW3 means paying a porting cost (02 §1.1 lists 5 classes of silent breakage) on every component, for the whole life of the site.
- **The time cost is small:** about 1–2 agent-days for both PRs on a 38-`.tsx` codebase. Hand-porting 10–20 components to TW3 would likely cost about as much in total.

**The path (each step is a branch + PR with a Netlify deploy preview):**

0. **Cleanup + baseline** (½ day).
   - Delete everything in 05 §6 "Delete": dead routes and heroes, `StatsBar`, the 7 unused deps, raw sprites out of `public/`, root `images/` and `Logo/`. A smaller surface means a cheaper migration.
   - Capture the baseline with 05's proven Playwright script, with Kaspersky blocked, plus Lighthouse. Commit it as `scripts/shots.mjs`, which 01 and 05 both describe.
1. **Framework PR.**
   - Run `npx @next/codemod@canary upgrade latest`.
   - Install `react@19 react-dom@19 @types/react@19 @types/react-dom@19 @react-three/fiber@^9 @react-three/drei@^10 next-intl@^4.14 motion`. Uninstall `framer-motion` (2 importers: `HeroSection`, `TiramisuWizard`).
   - Do the next-intl 4 changes (`getRequestConfig` returns `locale`).
   - Migrate `src/middleware.ts` to `proxy.ts`. **Note:** `proxy` is Node-runtime only. Verify the `/contact` → `public/qr/*.html` rewrite on the Netlify preview.
   - Replace `next lint` with the ESLint CLI. This means ESLint 9 and a flat config, since the current `eslint@8` + `next lint` script breaks.
   - Check `images.qualities`.
   - **Gates:** build passes; tiramisu 2D + 3D at parity on mobile (tiramisu reviewer signs off); admin login, CRUD, S3 upload and orders work; `/contact` is static and fast; screenshot diff shows no unintended change.
   - **Kill criterion:** if the 3D scene is not at parity after one focused day, abandon the PR. Stay on Next 14 / React 18 / TW3, switch only to `motion` (supports React 18), and follow 02's hand-port workflow. That is the fallback, not the plan.
2. **Tailwind 4 PR.**
   - Run `npx @tailwindcss/upgrade`. Bump `tailwind-merge` 2.x → **3.x**, which is the line for TW4. **No file mentions this; without it `cn()` merges classes incorrectly.**
   - **Gate on surfaces we keep** (admin, tiramisu, `/contact` — the last is untouched, being static HTML). Public home, gallery and detail pages only need "not broken", since they are being rebuilt. 01's "zero visual diff everywhere" gate costs time on pages about to be deleted.
3. **Design-system PR.** Write DESIGN.md and get owner sign-off (§3). Put tokens in `@theme` using **shadcn semantic names** (`--background`, `--foreground`, `--primary`, `--muted`, `--accent`, `--border`, `--ring`, …) mapped to brand values. Hand-write `components.json` (no `init` overwriting our CSS), set `"rtl": true`, and fix the font-variable bug (05 §4.1) as part of the new font setup.
4. **Revamp, section by section,** with the implementer/reviewer pair and screenshot gate (§3.7).

**What we explicitly don't adopt:**
- **GSAP.** Free, but it doesn't tree-shake, and a pinned scrub is the most likely thing to jank on low-end Android.
- **Lenis.** It does nothing on touch, which is most of our traffic.
- **21st "AI generate"** (Builder + AI).
- **Custom cursors, preloaders, shader backgrounds.**

### 2.2 Art direction (04 vs 01 / the skill vs 05)

| Element in 04 "Maison Patience" | Skill calibration item it hits |
|---|---|
| Paper `#F7F1E8` + Cormorant Garamond (high-contrast serif) + warm cocoa/gilt | **#1** cream + high-contrast serif + warm accent |
| Gilt hairlines, thin hairline frames, editorial columns | **#3** broadsheet hairlines |
| Eyebrow "Pâtisserie sur mesure · Sidi Bel Abbès · depuis 2018" | **#5** "A · B · C" meta string + eyebrow above heading |
| Captions "N° 042 — Le Jardin de Lina — Mariage, 120 parts" in small caps | **#5** "WORD — fragment" + caps labels |
| Numbered sections "01 Créations · 02 Occasions · 03 Tiramisu · 04 Commander" | Skill: numbering only for **real sequences**. These are not one. |
| Fraunces (Direction B) | Not in the skill's list, but Fraunces and Instrument Serif are now themselves among the most over-used "tasteful AI" display faces |

More conflicts:
- **Logo identity.** 05 says the site has two identities and that the **dark copper `/contact` look is the most distinctive**. 04 doesn't mention the dark copper/black 3D logo at all, and proposes ivory.
- **Hero choice.** 01 proposes the tiramisu builder as the hero. 04 proposes a full-bleed photo hero and lazy-loading 3D only on intent. 04 *also* says the photos are 718×960 Facebook recompressions that "look soft full-bleed". **That is an internal contradiction in 04.**

**Resolution:**
- **Keep 04's structure, IA and conversion work wholesale.** That is its real value: sticky WhatsApp bar, ref codes, prices, lead times, `/commander`, `/mariage`, the honest social proof, the photo pipeline, the seasonal engine.
- **Don't adopt any palette or typeface from 04 (or from the current site) yet.** Run the moodboard + two-pass token plan (§3.1–3.2). At least one candidate must start from the **copper/black logo and colours sampled from her best 12 cakes**, not from "pâtisserie = ivory + serif". Cream + serif stays *legal* if the owner chooses it for a stated reason. The skill says the brief wins.
- **Remove the tells regardless of direction:** no numbered nav sections (keep 01/02/03 only for the order steps and the tiramisu wizard), no middle-dot eyebrows, no "N° — Name —" captions, no gilt hairlines everywhere.
- **Hero:** no 3D on the home page (perf). Use a photo-led hero, but **framed at the photo's real resolution** (a plate up to about 720 CSS px wide on desktop, near full width on mobile), not full-bleed at 1440. Revisit full-bleed only if the owner supplies originals. Tiramisu is promoted as a section with a static poster, as 04 says.
- **Arabic type is a first-class decision, not a fallback.** 04's Amiri is credible. Test it against at least one other candidate with real Arabic copy at the actual sizes.

### 2.3 Motion (03 vs 01 / the skill vs 05)

- **Reveals.** 03 recommends a shared `<Reveal>` on every section, split-line reveals on every H2, and a marquee of "Mariage · Anniversaire · …". The skill calls *"fade-and-slide-up entrances on each section"* the AI default, and the marquee is a "·"-joined string. **Resolution:** one orchestrated moment per page, plus motion that answers user action (CTA feedback, sheet open, gallery → detail). Section reveals are off by default. A reveal is used only where a reviewer argues it encodes something. No marquee unless it carries real content (e.g. real photos), not category words.
- **The `SplitLines` hero H1 snippet reintroduces the LCP bug 05 measured.** With `initial={{ y: "105%" }}` inside `overflow-hidden`, the H1 is clipped out of view in the SSR HTML until hydration. On a throttled phone that recreates the about-8 s LCP. **Never on the H1 or LCP element.** If the hero headline animates at all, use a CSS-only animation from a visible state.
- **Blur Fade.** 02 ranks it ★★★ "universal section entrance". It animates `filter: blur`, which 03 §4.1 says never to do on large elements, and it is the generic default above. **Rejected.**
- **Shine Border, Floral Veil, Hero Parallax, 3D Carousel, Parallax Floating (02 shortlist).** These are decorative effect components, exactly the "SaaS landing" look 01 warns about. **Demote all to "reference only"** until DESIGN.md picks the one memorable thing.
- **Small a11y bugs in 03's snippets.** `aria-label` on a generic `<div>` (Marquee) is ignored by assistive tech. `aria-live` on the `<button>` itself is the wrong pattern; use a separate polite live region. `Magnetic` reads `matchMedia` during render, which causes a hydration mismatch (03 admits this). Fix them before reuse.

### 2.4 Minor contradictions

- **Fonts.** 04 says "the current layout declares 4 families for every locale". 05 measured that **only Great Vibes actually loads** (the CSS-variable override bug). 05 is right. 04's "only two load per locale" goal stands.
- **Current tokens.** 02 §6.2 says "use the existing tokens (cream, rose, gold, Playfair/Great Vibes/Inter/Cairo)". 01, 04 and 05 all say replace them. **02 is overruled.**
- **Locale detection.** 05 notes `/galerie` renders Arabic for returning AR users. 04 proposes renaming `/galerie` → `/creations`. Decide the URL policy once: keep the slugs (SEO), change labels only, and decide `localeDetection` explicitly.

---

## 3. Gaps: what a top studio would have before starting

1. **DESIGN.md content.** 01 specifies the format; nobody wrote it. It needs: subject/audience/job, the **one memorable thing**, 4–6 named hex values, type roles + scale (Latin and Arabic separately), ASCII wireframes for the home page at 390 and 1440, RTL rules, a motion budget, a banned list (skill defaults + §2.2/§2.3 above), and 3–5 references, each with the *specific attribute* to borrow.
2. **A moodboard and direction-selection step with the owner.**
   - Produce 2–3 token plans as static screenshots of the *hero + one cake card + one Arabic heading*, using real photos and copy.
   - At least one must be derived from the copper/black logo and colours sampled from her cakes.
   - The owner picks. Without this step we are guessing taste for her.
3. **Measurement (the largest gap).**
   - No analytics exist, so "conversion" can't be measured before or after.
   - Add privacy-light tracking **before** the revamp ships, to get a baseline. Options: Netlify Analytics, or a tiny `/api/event` writing to Mongo for `wa_click`, `tel_click`, `form_submit` and `tiramisu_complete`, each tagged with page + locale.
   - This is also the only way to measure the iOS-old-Safari share instead of guessing it.
4. **A data-model and admin plan.** 04's P0/P1 features need new fields and admin UI:
   - `ref` (GP-042), `priceFrom`, `leadTimeDays`, `servings`, `realEventPhoto` flag
   - category `image`
   - a `season` collection
   - `blurDataURL` generated at upload
   - consent-tracked testimonials

   Nobody scoped `CakeForm` (914 LOC) or the migrations. This is likely **more work than the visual revamp**, and it must come before the sections that display these fields.
5. **A measurable definition of done** (consolidating 04 §6.2 and 05 §8):

   | Metric (Lighthouse mobile, Kaspersky blocked, median of 3, on the **Netlify preview**, not localhost) | Target |
   |---|---|
   | Home Perf / LCP / TBT / CLS | ≥ 85 / < 2.5 s / < 200 ms / < 0.05 |
   | Gallery, detail | ≥ 85, LCP < 2.5 s |
   | Home JS (client, gzip) | ≤ 150 KB; R3F never in the home graph |
   | Home transfer, first view | < 1 MB |
   | Fonts | ≤ 2 families per locale, preloaded subsets |
   | In first mobile viewport (390×844) | H1 + one cake photo + primary WhatsApp CTA, visible without JS |
   | a11y | axe: 0 serious/critical; targets ≥ 24×24; full keyboard path; reduced motion respected |
   | RTL | 0 `isRTL` class ternaries; 0 `ml-/mr-/pl-/pr-/left-/right-/text-left/text-right` in public components (grep gate) |
   | i18n | 0 hard-coded UI strings (`localized()` removed); 3 locales in key parity |
   | Real device | one real mid-range Android on 4G, smoke test signed off by the user |

6. **The agent-pair setup for the revamp** (per the project methodology). Create `.claude/agents/ui-revamp-implementer.md` and `ui-revamp-reviewer.md`.
   - The reviewer gets **screenshots + DESIGN.md + the skill's calibration list + the done-table**, not the code diff first.
   - It must report pass/fail against those items only, to prevent endless polishing.
   - It owns the grep gates and the Lighthouse numbers.
   - Reuse the tiramisu pair for anything under `components/tiramisu/three`.
7. **An asset plan with owners and dates.**
   - Request originals for the A-list (about 12 cakes), on a fixed date.
   - Get the logo as a vector or high-res master, then produce pre-sized AVIF/WebP variants.
   - Commission a founder or hands shot, or decide against one.
   - Decide who does the grading and inpainting, and with which tool.
   - The hero design depends on this, so it is a **critical-path item**, not P1 polish.
8. **A copy plan.** Real FR/AR/EN copy written per section, Arabic reviewed by a native speaker (and the owner, for tone/Darija), all in `messages/*.json`. The skill says copy is design content. Lorem or English-first drafts produce template layouts.
9. **SEO preservation.** Keep slugs, hreflang, canonicals and JSON-LD. If any IA rename happens, add 301s and update `sitemap.ts`. Add a `FAQPage` only with owner-confirmed answers.
10. **Release plan.** One Netlify deploy preview per PR. The owner reviews on her phone. Ship by sections behind the existing routes, not as a big-bang. Keep a rollback (the previous deploy) one click away.
11. **Testing.** The repo has zero tests. At minimum: the screenshot script as a regression check, a unit test for the WhatsApp-message builder (the money path), and a smoke test for the admin save → ISR revalidation flow.
12. **Licensing record.** Keep `THIRD_PARTY_NOTICES.md` for any MIT component shipped (02 says so; make it a reviewer gate).

---

## 4. Quality critique: overclaims and risky recommendations

- **Vendor stats presented as numbers.**
  - 04: "+8–18 % sticky CTA" (vendor, and 04 flags it).
  - 04: "a feed swap cut page weight by ~90 %" (one Smash Balloon case, and Smash Balloon sells feeds).
  - 04: "Magnolia's occasion IA is a conversion driver (Krishaweb)" (an agency blog).
  - 03: GSAP 23 KB (taken from Motion's competitor page).
  - These are fine as direction, not as evidence. The sticky bar and WhatsApp context are worth doing because of the **measured** finding in 05 (no CTA above the fold on mobile), not because of the vendor numbers.
- **02: "Builder is the practical minimum".** This overclaims. Under the upgrade path, the libraries we'd favour (Motion Primitives, Magic UI, fancy components, Aceternity, cult/ui) are MIT on GitHub and readable for free. The design stance (01/04) is to hand-build 1–2 signature moments. **Recommendation:** start with a free 21st account for search and inspiration. Buy Builder ($8/mo quarterly, so a $24 minimum) only if more than about 3 retrievals a week are actually needed. The user decides.
- **02 shortlist bias.** 02 rates SaaS/effects components ★★★ for a pâtisserie. Its own §4.2 says most of the catalogue is SaaS/dark-tech. Treat the shortlist as a vocabulary of techniques, not picks.
- **03 performance risks on low-end Android:**
  - Scroll-driven *scrubbing* reveals on every section ("feels very 2026" is taste, not evidence).
  - `clip-path` + scale image reveals on many images at once.
  - Parallax layers.
  - A home-page Motion runtime.

  Our measured baseline (05) is a home page killed by exactly this class of JS animation. The default should be **no motion runtime on the home page at all** beyond one island. 03's own `LazyMotion` advice is correct; its pattern list is too generous.
- **04: "Fast 3G" LCP < 2.5 s** is not achievable as stated. 05's own `/contact` page (13 KB, 0 JS) reaches 1.5 s on simulated Slow 4G. Use the Lighthouse default mobile profile as the yardstick, as in §3.5.
- **04: "looping 3–5 s video" of the 3D preview on the home page.** Video weight on prepaid data conflicts with the < 1 MB budget. Use a poster image, with video only on tap.
- **04: "COD 85–95 %", "27 M weekly WhatsApp users".** These are industry blogs or Sensor Tower summaries (04 marks them medium). Fine for a strategy argument; not to be quoted to the client as fact.
- **05 measurement caveats:** single runs on a local `next start` against live Mongo over a home connection, with Lighthouse variance of 16–46. The *direction* is unambiguous; the absolute numbers are not a baseline. Re-baseline on the Netlify deploy (median of 3) in step 0.
- **01: "Next 16.3 auto-writes `CLAUDE.md`".** The upgrade guide confirms `AGENTS.md` (managed block, written by `next dev`). The `CLAUDE.md` part is unverified. Watch for uncommitted churn in the repo after `next dev`.
- **Windows MCP commands.** 01's `cmd /c` wrapper is the documented safe form. Keep it. Note that Kaspersky TLS interception can also break `npx` downloads for MCP servers (05 §7). If an MCP fails to start, check that before anything else.

---

## 5. Corrections each file needs

**01 — workflow**
- Installed versions are next 14.2.35 and TW 3.4.19.
- Add that **Next 16 itself sets the Safari 16.4 / Chrome 111 floor**, so TW4's browser risk is no longer a separate decision.
- Add the `tailwind-merge` 3 bump to the TW4 PR.
- Add ESLint 9 / flat config to the framework PR (the `next lint` script dies).
- Relax the TW4 gate to "kept surfaces zero-diff".
- Don't suggest the tiramisu builder (3D) as the home hero; it conflicts with the perf budget.
- Mark "auto `CLAUDE.md`" as unverified.

**02 — 21st**
- Rewrite §1.1, §4.4 and §6.2 for the TW4 + `motion` path: no `framer-motion` rewrites, use `motion/react` as-is, use shadcn semantic tokens instead of hand-mapping.
- Remove "use existing tokens (Playfair/Great Vibes/rose/gold)".
- Downgrade "Builder is the practical minimum" to "optional".
- Correct the Free tier: the pricing page says "2 free copies/day" without saying it is shared across web, MCP and CLI.
- Demote Blur Fade, Shine Border, Floral Veil, Beams and Hero Parallax to "reference only".
- Make `THIRD_PARTY_NOTICES` a gate.

**03 — motion**
- Version is `motion` 14.0.0, not v12. Re-check the upgrade guide for 12→14.
- `next-view-transitions` "because Next 14" is moot; defer page transitions and prefer React `<ViewTransition>` on 16.
- **Remove `SplitLines` from the H1/LCP.**
- Drop "Reveal on every section" and the category-word marquee as defaults.
- Fix the `aria-label`-on-div, `aria-live`-on-button and render-time `matchMedia` bugs.
- Source or remove "95 %+ touch".

**04 — brand/UX**
- Re-label Direction A as "hits skill defaults #1/#3/#5", not "recommended base".
- Remove the numbered nav sections, middle-dot eyebrows and "N° — —" captions.
- Resolve the full-bleed hero vs 718 px photo contradiction.
- Address the copper/black logo identity (05).
- Correct the font-loading claim per 05.
- Replace "Fast 3G" with the Lighthouse mobile profile.
- Change "video" to "poster" for the home tiramisu section.
- Add the data-model/admin work its features imply.

**05 — audit**
- State that the Lighthouse figures are single runs on local `next start`, to be re-baselined on Netlify (median of 3).
- Otherwise accurate. The best document in the set.

---

## 6. Questions for the owner / user (blockers in bold)

**Business facts (needed before any P0 content ships)**
1. **Minimum lead times:** standard, themed kids', wedding.
2. **Starting prices or per-guest price bands**, per category. Is she willing to publish them at all?
3. **Pickup address/hours, delivery zones and fees, deposit policy and accepted methods** (cash / BaridiMob / CCP).
4. Flavours list; allergens / ingredient claims she is comfortable stating.
5. Real numbers only: Instagram follower count, "depuis 2018" (correct year?), total creations.

**Brand and taste**
6. **Which identity is "her"?** The dark copper/black logo world (like `/contact`), the current cream/rose, or open? Any colours or fonts she loves or hates?
7. **Will she send originals** of her best ~12 cakes (Drive or WhatsApp "Document"), and by when? Is a founder or hands-only photo acceptable?
8. Arabic tone: MSA only, or some Darija warmth? Who validates the Arabic copy?
9. Should wedding/engagement be positioned as the premium line (a `/mariage` page, named collection)?

**Technical / budget (for Johnny)**
10. **Approve the upgrade path** (Next 16 / React 19 / TW4), accepting that iPhones on iOS ≤ 16.3 may get a degraded or broken experience. Or should we first measure with analytics for 2–4 weeks?
11. **Approve adding privacy-light analytics** (Netlify Analytics or a self-hosted event counter) to baseline WhatsApp clicks before the revamp.
12. 21st: free account only, or Builder ($8/mo quarterly)? (Recommendation: free first.)
13. Is the admin in scope for restyling, or only for the new fields?
14. Ship by section (recommended) or in one launch? Any date constraint, e.g. before the Ramadan 2027 campaign (lead-in late January 2027)?
15. Which real Android phone can be the test device?

---

## 7. Corrected setup commands (Windows; run in this order, after the user approves each)

```bash
# 1. Design skill (verified present in the registered official marketplace)
claude plugin install frontend-design@claude-plugins-official --scope project

# 2. Screenshots: primary = repo script (05 proved Playwright works here). MCP is optional.
npm i -D playwright@1.63.0 && npx playwright install chromium
claude mcp add --scope user --transport stdio playwright -- cmd /c npx -y @playwright/mcp@latest --viewport-size 1440x900

# 3. Perf / Lighthouse in the loop (official plugin form, or the cmd /c MCP form)
claude plugin install chrome-devtools-mcp@claude-plugins-official
#   alt: claude mcp add --scope user --transport stdio chrome-devtools -- cmd /c npx -y chrome-devtools-mcp@latest
#   Always block *kaspersky-labs.com* in measurements.

# 4. Current docs for Next 16 / TW4 / Motion / R3F 9
claude plugin install context7@claude-plugins-official

# 5. AFTER the framework PR (Next 16.3): runtime MCP in .mcp.json
#   { "mcpServers": { "next-devtools": { "command": "cmd", "args": ["/c","npx","-y","next-devtools-mcp@latest"] } } }

# 6. OPTIONAL, only if the user creates a 21st account (OAuth avoids storing a key):
claude mcp add --transport http --scope user 21st https://21st.dev/api/mcp
#   then /mcp -> Authenticate.  (API-key form: add  --header "x-api-key: <key>"; the key is then stored in plain text in ~/.claude.json)

# Verify
claude mcp list && claude plugin marketplace list
```

Not recommended now: GSAP, Lenis, the 21st AI tier, Figma MCP (there are no Figma files), Superdesign.

---

## Sources checked for this review

- 21st: https://21st.dev/pricing.md · https://21st.dev/mcp.md · https://github.com/21st-dev/magic-mcp · registry probe `https://21st.dev/r/dillionverma/blur-fade` (401-style JSON)
- Next 16 upgrade guide (browsers, proxy, revalidateTag, images): https://nextjs.org/docs/app/guides/upgrading/version-16
- Tailwind v4 compatibility: https://tailwindcss.com/docs/compatibility
- GSAP 3.13: https://gsap.com/blog/3-13/
- next-view-transitions: https://github.com/shuding/next-view-transitions + npm peer dependencies
- R3F v8/React 19: https://github.com/pmndrs/react-three-fiber/issues/3398 + npm peer dependencies (fiber 8/9, drei 9/10)
- npm registry (2026-10-04): next 16.3.8, react 19.3.0, fiber 9.8.1, drei 10.7.9, next-intl 4.14.9, motion 14.0.0, tailwindcss 4.3.3, next-view-transitions 0.3.5, gsap 3.15.0, tailwind-merge 3.7.0
- Statcounter Algeria mobile OS: https://gs.statcounter.com/os-market-share/mobile/algeria
- Local, read-only: `claude plugin marketplace list`, `claude mcp list`, `claude plugin install --help`, the official marketplace `marketplace.json`, frontend-design `SKILL.md`, `package.json`, `node_modules` versions, `next.config.mjs`, `src/middleware.ts`, `components/tiramisu/three/*`, `.claude/agents/`

**Not verified (reviewer knowledge):** that `tailwind-merge` 3.x is the TW4-compatible line (high confidence, not fetched today). The iOS ≤ 16.3 share in Algeria (estimated, not measured). The Motion 12→14 breaking-change notes.
