# DESIGN.md: Gateaux Patience, art direction (FINAL)

*Decided 2026-10-04 by the lead after comparing two competing directions (mockups in `design/direction-a` and `design/direction-b`).*

## Decision

**Base: Direction B, « Écrit en sucre ».** Read `design/direction-b/DESIGN.md` in full. It is the spec, except where this file amends it. Look at `design/direction-b/shots/*` to see the intended look.

**Borrowed from Direction A, « Écrin »:** the *dark jewel-case surface* for premium moments only. Read `design/direction-a/DESIGN.md` §1–2 for its spirit. A's palette, fonts and glaze are **not** adopted.

Why: B's idea (her cakes carry names, the tiramisu *is* a name, so the visitor's name is the headline) is specific to this brand, turns the signature moment into a conversion device, and lets the colourful catalogue sit naturally on a light ground. A's dark surface is better for weddings and is the logo's native habitat, so it is used *as a surface*, not as the whole site.

## Amendments to B (these win over direction-b/DESIGN.md)

1. **One dark: `--paillette #16131D`.** The "écrin surface" is paillette with the sequin dot texture (B §7 steps band) plus an optional 1px copper bezel (`--cuivre` at ~45% alpha) around framed photos. Use it for exactly these:
   - the "how to order" steps band
   - wedding/engagement moments (the chip or section, and the cake detail when category = wedding): ring lettering in **cuivre on paillette**, more whitespace, Dela set ~20% smaller
   - the stage behind the tiramisu preview
   - the footer, where the real logo PNG (`public/Logo/...`) sits frameless, its dark ground feathered into paillette with a radial mask

   Never the whole page.
2. **No children's names published as titles.**
   - Card titles = the cake's existing translated title from the DB (owner-authored).
   - The ring lettering on the home hero uses a **neutral default**: FR "Joyeux anniversaire", AR "عيد ميلاد سعيد", EN "Happy birthday". The visitor's typed name is appended live.
   - Detail pages use the occasion phrase for the category (Mariage → "Félicitations", Naissance → "Bienvenue", Réussite → "Félicitations", birthday → "Joyeux anniversaire").
3. **No per-cake colour data entry.**
   - Each cake's `piping`/`tint` pair is chosen **deterministically** from B's 5-colour piping set by hashing the cake id.
   - Wedding cakes use `or`.
   - No DB writes.
4. **Ref codes without migrations.**
   - `ref = "GP-" + base36(hash(cake.id)).slice(0,4).toUpperCase()`: stable, unique enough for 23 to a few hundred cakes, computed in one helper (`src/lib/cake-ref.ts`), with a collision check in dev.
   - Shown on cards, the detail page and in WhatsApp messages.
5. **Wordmark.** An inline SVG wordmark (crown disc + "Gateaux Patience"), identical in every locale. Generate paths once from Dela Gothic One (e.g. with `opentype.js` in a one-off script), commit the SVG, and don't load Dela on AR just for the wordmark.
6. **Fonts via `next/font/google`:**
   - Dela Gothic One (Latin subset; FR/EN only)
   - Lalezar (Arabic; AR only)
   - Readex Pro (variable; Latin + Arabic)

   Fix the audit's `globals.css` bug that overrode the next/font variables. Max 2 families per locale.
7. **Business facts.**
   - `src/lib/business.ts` exports `LEAD_TIME_DAYS`, `PRICE_FROM`, `DELIVERY`, `PAYMENT` and `DEPOSIT`, all `null` with an `// OWNER: confirm` comment. The UI hides anything `null`. Never invent them.
   - The WhatsApp brief asks for date and guests instead of quoting prices.
8. **Tiramisu letters are Latin-only.** In AR, the live name preview on the tiramisu tile appears only when the name is Latin. Otherwise the tile shows its static sample. Never fake Arabic letters.
9. **Motion implementation.**
   - Use B's tokens and per-page signature moments. CSS first.
   - `motion/react` with `LazyMotion` + `m` only where CSS can't do it (shared layout indicators, sheets).
   - Card → plate View Transition: Next 16 `experimental.viewTransition` + React `<ViewTransition>` if stable enough, else `document.startViewTransition`; plain navigation as fallback.
   - Global `MotionConfig reducedMotion="user"` plus CSS `prefers-reduced-motion` guards.
10. **Sticky bar** per B, plus: a context-aware WhatsApp message built by one shared function, `src/lib/whatsapp.ts` (`buildWhatsAppUrl({ locale, kind, cake?, name?, date?, guests?, page })`), localized, with a small unit test (node:test).

## Scope of the `revamp-2026` branch

| Page | Content |
|---|---|
| **Home** | hero (plate + scalloped board + ring + name field + WhatsApp CTA); "what we make" full-bleed bands (Gâteaux sur mesure / Tiramisu personnalisé / Mariages & fiançailles); creations grid (featured, up to 8, 2-col mobile / 4-col desktop); steps band (écrin); Instagram strip (link + real handle, no embed script); footer (écrin + logo) |
| **Gallery** (`/galerie`) | chips (from DB categories, with counts) + grid of cards; the filter is kept in the URL (`?c=`), so back/forward and sharing work; card → plate transition |
| **Cake detail** (`/galerie/[slug]`) | plate + board with the occasion phrase; "Écrire mon prénom" re-pipes it; brief (date, guests, name) → WhatsApp with ref; image gallery (swipe on mobile; keep react-zoom-pan-pinch only if already lightweight); dimensions/portions if present; related cakes; detail moments on the écrin surface for weddings |
| **Tiramisu** | **visual reskin only**: tokens, fonts, buttons, stage surface. Do NOT change `tiramisu-layout.ts`, `tiramisu-templates.ts`, the canvas/3D engines or the wizard's step logic |
| **Header / footer / sticky bar / 404** | per B + amendments |

The admin is out of scope (don't restyle it). The `/contact` QR page is untouched. Home must stop being `force-dynamic`: use ISR (`revalidate`) + `revalidateTag`/`revalidatePath` calls from the admin save routes.

## Definition of done

`research/website-revamp/06-critical-review.md` §3.5, plus B's "first viewport" rule (H1 + real photo + WhatsApp CTA at 390×844 in fr/ar/en).
