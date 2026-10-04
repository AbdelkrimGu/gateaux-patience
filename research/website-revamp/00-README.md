# Gateaux Patience — Website Revamp Research (2026-10-04)

The research done **before touching any code** for the full revamp. It covers how to equip Claude Code to build premium UI, 21st.dev, motion craft, brand/UX/conversion, an audit of the current site, and a critical review that reconciles everything.

> If you read only one thing, read this file, then `06-critical-review.md`.
> Where a file disagrees with 06, **06 wins**: it verified claims and resolved the contradictions.

## Files

| # | File | What it answers |
|---|---|---|
| 01 | [01-claude-code-ui-workflow.md](01-claude-code-ui-workflow.md) | How strong frontend engineers use Claude Code for great UI: the `frontend-design` skill, the anti-"AI slop" rules, screenshot feedback loops (Playwright / Chrome DevTools MCP), DESIGN.md-first workflow, component libraries, stack upgrade analysis |
| 02 | [02-21st-dev.md](02-21st-dev.md) | What 21st.dev is in 2026 (the 21st MCP, formerly Magic), pricing, API key, licence vetting, a shortlist of about 40 components, RTL caveats |
| 03 | [03-motion-and-animation.md](03-motion-and-animation.md) | The motion stack (Motion vs GSAP vs Lenis vs CSS-native), patterns ranked for a patisserie, motion tokens (durations, easings, springs), 11 snippets, performance / reduced-motion / RTL rules |
| 04 | [04-brand-ux-conversion.md](04-brand-ux-conversion.md) | Benchmarks (Pierre Hermé, Ladurée, Ansel, Grolet, Porschen…), art directions, WhatsApp-first conversion design, honest social proof, photo plan, Algeria specifics, seasonal calendar |
| 05 | [05-current-site-audit.md](05-current-site-audit.md) | Measured audit of the current site: Lighthouse, screenshots, bugs, keep / rebuild / delete lists, whether the Windows screenshot loop works |
| 06 | [06-critical-review.md](06-critical-review.md) | Reviewer pass: 13 claims fact-checked, ONE tech path, art-direction reconciliation, gaps, definition of done, owner questions, corrected setup commands |

## The 10 findings that matter most

1. **The current home page is slow on mobile.** Lighthouse scores 16–46, LCP is 8–9 s and TBT 1–2 s. The causes are framer-motion everywhere, six timer-driven image cyclers, and an H1 that fades in only after JS loads. The static `/contact` page scores 95 and is the benchmark. *(05)*
2. **The brand fonts never actually rendered.** `globals.css` overrides the next/font variables, so the site shows Georgia, Segoe UI and Arial. Arabic RTL also gets partly flipped back to left-to-right by manual `flex-row-reverse`. *(05)*
3. **The current look is the "default AI aesthetic"**: cream + high-contrast serif + rose accent + Inter. Anthropic's `frontend-design` skill lists it as the first thing to avoid. The new direction must come from *her* material: the copper/black logo, colours sampled from her real cakes, and the tiramisu configurator as the signature element. *(01, 06)*
4. **Conversion leaks are practical, not visual.** There are no prices, no lead times and no delivery/payment info. The mobile "Commander" button is hidden in the hamburger menu. WhatsApp links open an empty chat with no cake context. *(04)*
5. **Ordering should be WhatsApp-first**:
   - a sticky mobile bar (WhatsApp + Call)
   - a reference code per cake (`GP-042`)
   - an optional 3-field brief (date / guests / occasion) that pre-fills a structured WhatsApp message
   - a shortlist of 1–3 cakes sent to WhatsApp

   Algeria is about 88–89 % Android and orders are mostly cash on delivery. *(04, 06)*
6. **Social proof must stay honest.** Use real Instagram counts, a static IG grid, "real event" photos, and a consent routine to collect real reviews. Never fabricate any of it. *(04)*
7. **Motion should be restrained, with one strong moment per page.**
   - Use Motion (`motion/react`) with `LazyMotion` (about 4.6 kB at first load) and CSS scroll-driven reveals as progressive enhancement.
   - The H1 and hero image must never depend on JS to appear.
   - No letter-splitting of Arabic text.
   - Mirror every directional animation in RTL.
   - Respect reduced motion everywhere.
   - No GSAP or Lenis for now.

   *(03, 06)*
8. **21st.dev now always needs an account and API key.** The free plan allows 2 copies/day; Builder costs $6–8/mo. Use it through the 21st MCP (`https://21st.dev/api/mcp`, OAuth). Ship only MIT/Apache components, and don't put "Blur Fade on every section". *(02, 06)*
9. **Tech path (decided in 06), with each step as its own PR and a Netlify preview:**
   - (0) delete dead code, then take a baseline of screenshots and Lighthouse;
   - (1) Next 16.3 + React 19 + R3F 9 / drei 10 + next-intl 4.14 + `motion`;
   - (2) Tailwind 4;
   - (3) the design system (DESIGN.md + tokens);
   - (4) the revamp, section by section.

   Next 16 already sets the Safari 16.4 / Chrome 111 browser floor, so Tailwind 4 adds no real extra risk. **Kill criterion:** if the 3D tiramisu isn't at parity after one day of work, fall back to staying on Next 14.
10. **The biggest gaps are not visual:**
    - analytics, to measure conversion before and after;
    - a data model and admin for ref codes / prices / lead times / seasons;
    - originals of her best ~12 photos, which are on the critical path for the hero;
    - the owner's sign-off on a moodboard.

## How I (Claude Code) will work on the revamp

- **Toolkit:**
  - `frontend-design` skill
  - Playwright screenshot script (3 locales × phone / desktop)
  - Chrome DevTools MCP (Lighthouse and traces)
  - context7 (current docs)
  - optional 21st MCP
  - Exact commands are in 06 §7.
- **Process:** DESIGN.md brief → 2–3 moodboard options built from real photos → owner picks → tokens → build one section at a time. After each section, a **reviewer agent** judges *screenshots* against DESIGN.md, the anti-slop list and the definition-of-done table, then I fix and repeat. This is the implementer/reviewer agent pair: `ui-revamp-implementer` + `ui-revamp-reviewer`.
- **Measurement hygiene:**
  - Measure on the Netlify preview, never on localhost.
  - Block `*kaspersky-labs.com*` in every run.
  - Use a fresh browser context per locale.
  - In Git Bash, set `MSYS_NO_PATHCONV=1`.

## Definition of done (from 06 §3.5)

| Target | Value |
|---|---|
| Home Lighthouse mobile (Perf / LCP / TBT / CLS) | ≥ 85 / < 2.5 s / < 200 ms / < 0.05 |
| Home client JS | ≤ 150 KB gz; R3F never loaded on home |
| First mobile viewport (390×844) | H1 + a cake photo + WhatsApp CTA, visible without JS |
| Accessibility | axe 0 serious; tap targets ≥ 24 px; reduced motion respected |
| RTL / i18n | no left/right physical classes in public UI; no hard-coded strings; 3 locales at key parity |
| Real device | smoke test on a real mid-range Android over 4G |

## Open questions (blockers in bold; full list of 15 in 06 §6)

- **Owner:** lead times, starting prices / price bands, delivery + payment + deposit policy, which identity is "hers" (copper/black vs cream/rose), originals of ~12 best cakes.
- **You:**
  - approve the upgrade path;
  - approve privacy-light analytics;
  - choose the 21st plan (free first is recommended);
  - say whether the admin restyle is in scope;
  - ship by section or in one launch, and any deadline (Ramadan 2027 lead-in is late January 2027);
  - which Android phone to use as the test device.
