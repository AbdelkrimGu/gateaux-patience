# 07 — Intent-first flow: "Custom Cakes · Sweets · Tiramisu" (spec for branch `revamp-2026-intent-flow`)

*Author: Claude (lead). Date: 2026-10-04. Builds ON TOP of branch `revamp-2026` (same design system, DESIGN.md). Art direction comes from DESIGN.md; this file defines structure, behaviour and flow only.*

## 1. The idea

Most visitors arrive on a phone, often from Instagram or a QR code, already knowing roughly what they want. Instead of a long scrolling brochure, the home page **asks one question** and gives **three big answers**:

> **Qu'est-ce qui vous ferait plaisir ?** / **ماذا تشتهي اليوم؟** / **What are you craving?**
> **Gâteaux sur mesure** · **Douceurs** · **Tiramisu**

Two jobs at once:
1. **Action.** The visitor commits to a path in one tap (choice → page), the first micro-commitment of the funnel.
2. **Awareness.** All three offers are visible together in the first phone viewport. Even someone who taps "Tiramisu" has *seen* that custom cakes and sweets exist, and that seed matters when the next birthday comes.

Everything after that is about **moving between the three universes without friction**.

## 2. Routes

| Universe | Route (all locales; `localePrefix: as-needed`) | Source of content |
|---|---|---|
| Home = intent gate | `/` | static copy + 1 representative image per universe |
| Custom cakes | `/galerie` (keep the URL; SEO + existing links) | Mongo `cakes` in categories whose `universe` is `cakes` (default) |
| Cake detail | `/galerie/[slug]` | unchanged data |
| Sweets (**new**) | `/douceurs` | Mongo categories with `universe: "sweets"` + a static "menu of sweet types" |
| Tiramisu | `/tiramisu` | existing wizard (engine untouched) |

- Add `universe?: "cakes" | "sweets"` to `Category` (`src/lib/db-types.ts`); missing → `"cakes"`. Seed default on read: the slugs `desserts` and `customs` count as `sweets` *only if* no explicit value is set. **Verify by viewing the `customs` category's photos first.** If they are cakes, keep them in cakes.
- Admin: a small "Univers : Gâteaux / Douceurs" select in `CategoriesManager.tsx`, so the owner (non-technical) controls it. Do not restyle the admin. **The DB is live production: no migrations that write. Defaults are applied at read time; only the owner's own admin saves write the field.**
- Add `/douceurs` to `sitemap.ts`, hreflang alternates, metadata in 3 locales, and JSON-LD `hasOfferCatalog` if the Bakery schema allows it cleanly.

## 3. Home (intent gate): behaviour

- **First viewport at 390×844 must contain:** the brand (logo/wordmark), the question (H1), and **all three choice cards fully visible, with no scrolling**. Each card has a real image (cakes: the best real cake photo; tiramisu: a real base photo from `public/images/tiramisu/templates/*/base.png` or the customizer render; sweets: the best available real sweets photo, otherwise a typographic or illustrated card, **never a fake photo**), a title, a 3–5-word "what's inside" line (e.g. "Anniversaires · Mariages · Enfants"), and an affordance arrow (mirrored in RTL).
- Desktop: the three cards side by side, large, with the same question. It must feel like the opening of a maison, not a form.
- Below the fold (for people who scroll): a short brand strip (since 2018, Sidi Bel Abbès, made to order), "how ordering works" in 3 steps, the Instagram link, and the footer. Keep it short; the gate is the page.
- **Returning visitor nicety:** if `localStorage` holds a last-visited universe or a non-empty tiramisu bucket, show a small "Reprendre : Tiramisu (2 boîtes)" chip above the cards. This is client-only enhancement. The server HTML never depends on it, and it must not cause layout shift (reserve space or overlay).
- The H1 and cards are server-rendered and visible without JS. Entrance motion, if any, uses transform only and never opacity-gates the LCP.

## 4. Moving between universes (the core of this branch)

1. **Universe switcher.** On universe pages, the header carries a 3-segment switcher `[Gâteaux | Douceurs | Tiramisu]` with the current one marked (`aria-current="page"`). The indicator glides between segments (shared layout animation) and is mirrored in RTL. On phone it is thumb-reachable and always visible: either a compact segmented control in the sticky header, or merged into the bottom sticky order bar. Choose whichever reads better in screenshots, and justify the choice. It must never cover content or the order CTA.
2. **Shared-element transition from home.** Tapping a home card morphs its image into the destination page's hero (View Transitions: Next 16 `experimental.viewTransition` + React `<ViewTransition>` or `document.startViewTransition`; fall back to an instant navigation). Switching universes uses a short directional slide/crossfade, where direction follows the switcher order and is mirrored in RTL. Reduced motion: no motion.
3. **State is never lost.**
   - The tiramisu bucket and wizard step persist in `sessionStorage` (versioned key; validated on restore against the catalog). Leaving Tiramisu for Gâteaux and coming back restores the bucket.
   - The gallery's selected category filter and scroll position are restored on back/forward.
4. **Cross-sell at the end of each universe.** A "Vous aimerez aussi" block shows the **other two** universes as compact image cards. No dead ends: the bottom of every universe page leads to the other two plus the order CTA.
5. **Prefetch.** All three universe routes are prefetched once the home or any universe page is idle, so a switch feels instant on 4G.
6. **Tiramisu wizard integration.** The wizard is a full-screen 100dvh experience. Show the switcher on its first step (mode selection). On deeper steps, replace it with the wizard's own back/close affordances, so switching universes mid-order can't happen by accident. If the user does leave, the bucket persists (point 3).
7. **Analytics hooks (no vendor yet).** Fire `window.dispatchEvent(new CustomEvent('gp:intent', {detail:{universe, from}}))` on gate choice and switcher use. Cheap now, and wired to real analytics once approved.

## 5. Sweets page (`/douceurs`)

What the owner defined as sweets: **cupcakes, cake pops, popsicles (cakesicles), desserts**. There are currently no products in the sweets categories, so:
- **Hero:** title + a one-line promise + the primary CTA "Composer ma commande" (WhatsApp, pre-filled with "Douceurs" context).
- **"La carte des douceurs":** a menu of the sweet types (cupcakes, cake pops, popsicles, desserts). Each tile has a name, a one-line description, typical use ("parfait pour un goûter d'anniversaire, une naissance, un mariage") and a tap target that pre-fills WhatsApp ("Bonjour, je souhaite des cake pops pour …"). Visuals are typographic/illustrative unless real photos exist. **No invented prices.**
- **Real creations:** if the sweets categories hold published items, show them as cards (same card component as gallery). If not, hide the section entirely (no "coming soon" emptiness).
- **"Make it a set":** suggest pairing with a cake or tiramisu boxes, which links to the other universes (cross-sell, §4.4).
- A note telling the owner, in a code comment and `research` docs only (not the UI), to add sweets photos through the admin categories marked "Douceurs".

## 6. Ordering context per universe

The sticky bottom order bar (from `revamp-2026`) changes its pre-filled WhatsApp message by universe:
- **cakes:** "Bonjour, je souhaite commander un gâteau [— <cake title>, réf. <ref>]…"
- **sweets:** "Bonjour, je souhaite des douceurs (cupcakes / cake pops …)…"
- **tiramisu:** the wizard keeps its own flow; the bar is hidden while the wizard owns the screen.

Messages are built by one shared, unit-tested function, localized in 3 languages.

## 7. Definition of done (in addition to 06 §3.5)

- [ ] At 390×844, in fr/ar/en, the home first viewport shows H1 + all 3 cards fully, with no scroll and no layout shift.
- [ ] One tap from home reaches any universe; one tap from any universe reaches any other.
- [ ] The tiramisu bucket survives a round trip Tiramisu → Gâteaux → Tiramisu.
- [ ] The switcher has `aria-current`, is keyboard-reachable, and is mirrored in AR.
- [ ] `/douceurs` exists in 3 locales, is in the sitemap, has metadata, and contains no fabricated content.
- [ ] Reduced motion means no transitions; with no View Transitions support, navigation is still instant and correct.
- [ ] Lighthouse mobile on home ≥ 90 (the gate is lighter than a brochure home, so hold it to a higher bar).
