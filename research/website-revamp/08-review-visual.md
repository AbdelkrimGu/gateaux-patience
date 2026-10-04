# 08: Visual / creative-director review of `revamp-2026`

*Reviewer lens: creative director (visual quality, brand fidelity, conversion, RTL/Arabic quality, motion feel). Date: 2026-10-04. Server: production build at http://localhost:3123. Read-only review: no source files changed.*

All evidence is under `.shots/review-visual/`:

- `scroll/{locale}-{p390|p360|d1440}-{route}-NN.png`: viewport-by-viewport scroll captures (home, /galerie, /galerie?c=wedding, wedding-ish slug, kids detail, 404).
- `interact/`: hero name typing (Latin + Arabic in every locale), the mobile menu, view-transition frames (`*-vt-*`, and `*-vtslow-*` at 0.08× playback), the wedding detail (`*-wedding-N`), the tiramisu steps (`*-tira-N`), plus `log.json` with every decoded WhatsApp href.
- `base/`: default `shoot.mjs` run. **Warning:** its `*.full.png` desktop shots in en/ar show a white band across the hero. That is a screenshot artefact (full-page capture + `content-visibility`), not a site bug. Scrolled captures of the same pages render correctly.
- `_tools/`: the Playwright scripts used (`cap.mjs`, `interact.mjs`, `vt.mjs`, `tira.mjs`).

## Verdict in one paragraph

The home page now looks like a real, specific brand and no longer like a template. The lettered board, the piped ring and the name-to-WhatsApp loop are distinctive and work in all three locales, including correct bidi when a Latin name is typed on the Arabic page. RTL is genuinely mirrored. The wedding detail on the écrin surface is the best screen on the site. What would embarrass the client today is **content, not code**: a customer Messenger chat screenshot is published as a cake photo, slugs contradict titles (the URL `…/gateau-remise-diplome` is the engagement cake), titles have spelling errors, and watermarks show on almost every card. Code-side, the main problems are:

- desktop detail pages have no cake-specific CTA above the fold;
- Arabic names typed on FR/EN pages render in a thin fallback face;
- the tiramisu flow still feels like a different app;
- the Arabic copy mixes singular and plural address and has a few literal calques.

---

## Findings, prioritized

### BLOCKER

**B1. A customer chat screenshot is published as a cake photo.**
- Evidence: `scroll/fr-p390-galerie_gateau-princesse-couronnee-01.png` and `scroll/fr-d1440-galerie_gateau-princesse-couronnee-00.png`. The "Plus de photos" strip shows a Messenger screenshot ("Toooop aleh ya3tik saha… Bajbathom… Partage hhhhh").
- Why it matters: it exposes a private conversation and looks amateur on the very cake used as the home hero (GP-R909).
- Fix: remove that image from the cake in the admin (data). As a guard, `src/components/gallery/PhotoStrip.tsx` could skip images the admin flags as "not a product photo", but the real fix is data hygiene. Then audit all 23 cakes' extra images.

**B2. Slugs contradict titles.**
- Examples:
  - `/galerie/gateau-mariage-elegance` is "Tarte Raiponce" (a kids' Rapunzel cake);
  - `/galerie/gateau-remise-diplome` is "Tarte de Fiancaille" (engagement);
  - `gateau-moderne-chic` is "Tarte Spiderman";
  - `gateau-elegance-doree` is "Tarte Mini-Mouse".
- Evidence: `scroll/info-p390-fr_ar_en.json`, and the "Vu ici :" line in `interact/log.json`.
- Why it matters: the URL is pasted into every WhatsApp brief ("Vu ici : …/gateau-remise-diplome" for an engagement cake), and Google indexes the wrong words.
- Fix: regenerate slugs from the FR title, with 301s from the old slugs. This is an admin/data task plus a redirect map in `src/proxy.ts` or `next.config` `redirects()`.

### MAJOR

**M1. Desktop cake detail: no cake-specific order button in the first viewport.**
- Evidence: `scroll/fr-d1440-galerie_gateau-princesse-couronnee-00.png`. The sticky bar is hidden at ≥900px, and the header "Commander" pill sends the generic brief (`log.json`: no ref, no cake). "Commander ce gâteau" sits about 1.5 screens down.
- Fix: in `src/components/gallery/CakeStudio.tsx`, render the primary `Commander ce gâteau` button (the same `buildWhatsAppUrl` href as the brief) directly under the name field on desktop. Optionally, also make the header pill context-aware on detail pages.

**M2. An Arabic name typed on FR/EN pages renders in a thin fallback font**, both in the ring and in the input.
- Evidence: `interact/fr-hero-arabic.png`, where "ياسمين" looks like a system font beside the Dela "JOYEUX ANNIVERSAIRE".
- Why it matters: many Algerian parents browsing in French will type the name in Arabic.
- Fix:
  - In `src/components/ui/LetteredBoard.tsx`/`.module.css` and `src/components/ui/NameField.tsx`, add a weighted Arabic fallback to the display stack (`font-family: var(--font-dela), var(--font-readex)` with `font-weight:700` for Arabic runs). Make sure the Readex Arabic subset is requested on FR/EN, or lazy-load Lalezar on the first Arabic keystroke.
  - Note: `tracking-[0.02em]` is only reset under `:lang(ar)`, so on FR pages the Arabic input text also gets letter-spacing. Use `[dir=rtl]`/a script check instead.

**M3. Watermarks and mixed photography.**
- Evidence: `scroll/fr-p390-home-02.png`, `-03.png`, `scroll/fr-d1440-home-02.png`. "gâteaux patience" watermarks show at card size on most cards (six times on the graduation cakesicles). Owner-regraded "studio" photos sit beside raw black-sequin phone shots.
- Why it matters: this is DESIGN B §13's top weakness, still open.
- Fix: owner originals, or crop/inpaint them. Until then, put the studio-graded photos first in `src/components/home/pick-cakes.ts` (home featured order) and push the heaviest-watermarked ones (cakesicles, Superman, bus) down.

**M4. Titles and category labels are not copy-edited** (all owner data, visible everywhere):
- "Tarte de Fiancaille" should be « Gâteau de fiançailles »;
- "Tarte Nouveau Née" is ungrammatical; use « Gâteau naissance » / « Nouveau-née »;
- "Tarte Cocomelon Lighting bus" is franglais;
- "Création Colorée Personnalisée" and "Anniversaire Enfants" use English Title Case (French takes « Anniversaire enfants », « Mariage & fiançailles », « Diplôme & remise »);
- "Tarte de l'espace" uses a straight apostrophe;
- "Tarte"/"Gâteau" and AR "كيكة"/"كعكة" are mixed for the same thing.

Fix: one copy pass in the admin. Consider a display-time `’` substitution in `src/components/gallery/catalog.ts`. The AR category "حمل" (Grossesse) is ambiguous; use « مولود جديد ».

**M5. The tiramisu flow still reads as a different product.**
- Evidence: `interact/fr-tira-0.png`, `fr-tira-1.png`.
- Step 0 problems:
  - a 430px static stage fills over half the first viewport;
  - the header loses the language switch, the menu and any WhatsApp path.
- Step 1 problems:
  - one lonely product card sits two-thirds wide on the start side, with a large empty field around it;
  - the disabled CTA ("Ajoutez une boîte") is white on washed pink, about 2.6:1, so it reads as broken rather than disabled.
- Fix, in `src/components/tiramisu/TiramisuWizard.tsx` and `tiramisu.module.css` (visual only, per scope):
  - cap the step-0 stage at about 300px tall on phones;
  - make product cards full-width or a 2-col grid;
  - style the disabled CTA as a ghost/paillette-outline button with full-contrast text;
  - keep a small WhatsApp icon button in the wizard header.

**M6. The Instagram section promises content it does not show.**
- Evidence: `scroll/fr-p390-home-05.png`, `fr-d1440-home-04.png`. The title is "Les dernières créations, sur Instagram", but the section holds only a handle on a big empty band.
- Fix, in `src/components/home/InstagramStrip.tsx`: retitle as an invitation (« Suivez-nous sur Instagram » / « تابعونا على إنستغرام » / "Follow us on Instagram"), or show 3 to 4 static card-size crops of real cakes linking to the profile (no embed).

**M7. Arabic copy: inconsistent address and literal calques** (`messages/ar/*.json`).
- Address flips between singular (`common.json` "اطلب عبر واتساب", `how_to_order` "اطلب الآن", `home.steps` "اختر… أرسل", hero "فكرتك") and plural (`cake.json` "اطلبوا هذه الكعكة", "اكتبوا اسمًا", `gallery.json` "صِفوا كعكتكم", `home.make` "بألوانكم… تختارونها"). Pick one. Recommendation: polite plural in body copy, keeping the short CTAs singular is acceptable, but make it a written rule. The simplest coherent choice is plural everywhere: « اطلبوا عبر واتساب ».
- Calques and better phrasings:
  - `home.make.wedding_text` "للطلب الرسمي أو الخطوبة أو العرس" ("la demande" calque) → « لطلب اليد أو الخطوبة أو العرس: كعكة بألوانكم وعليها الكلمات التي تختارونها. »
  - `cake.name_hint` "يُكتب الاسم على الصينية" ("plateau" → tray) → « يُكتب الاسم حول الكعكة، ثم يُضاف إلى رسالتكم. »
  - `cake.name_label` "اكتبوا اسمًا" → « الاسم المراد كتابته »
  - related title "على نفس الطابع" → « كعكات على الطراز نفسه »
  - brief hint "وما تملؤونه هنا" → « وكل ما تكتبونه هنا »
  - category "عيد ميلاد البالغين" → « أعياد ميلاد الكبار »
- Good and natural, keep: "كعكة تحمل اسم من تحبّ.", "ألف مبروك", "احتفلنا معهم في سيدي بلعباس", "اطلب في ثلاث رسائل", "تيراميسو بالاسم".

### MINOR

**m1. The wedding filter (`/galerie?c=wedding`) has no écrin moment.** Evidence: `scroll/fr-p390-galerie_c_wedding-00.png`. Amendment 1 asks for "the chip or section" on paillette. Today only the selected chip is dark, as for any chip.
- Fix: in `src/components/gallery/GalleryFilter.tsx`, when `c=wedding`, wrap the intro in `EcrinSurface` with cuivre accents.
- The wedding WhatsApp brief also stays generic ("un gâteau personnalisé", URL without `?c=wedding`). Pass `kind: "wedding"` to `buildWhatsAppUrl` (`src/lib/whatsapp.ts`) so it says « un gâteau de mariage / fiançailles ».

**m2. Wedding detail name field.** Evidence: `interact/fr-wedding-0.png`. The dragée-pink inner pill on paillette breaks the écrin mood.
- Fix: in `src/components/ui/NameField.tsx`, add an `ecrin` variant (sucre/6% background, cuivre text, bezel), wired from `CakeStudio` `ecrin`.
- The wedding H1 is set in sucre, which is fine.

**m3. Card → plate transition lands scrolled ~60px.** `vt.mjs` measured `scrollY=60` after the transition vs `0` on direct load (`interact/fr-vt-end.png`), so the header and wordmark are hidden on arrival.
- Fix: in `src/components/gallery/CardTransitionScope.tsx`, call `window.scrollTo(0,0)` inside the transition update callback, or navigate with `scroll: true` before the VT snapshot.
- The morph itself works (`interact/fr-vtslow-1..3.png`): the plate and board fly from the card position with a short crossfade ghost. Acceptable.

**m4. The 404 page shows an empty beige U-frame.** Evidence: `scroll/fr-p390-nope-404-00.png`. It reads as a missing image.
- Fix: in `src/app/[locale]/not-found.tsx`, put a real cake photo in the plate (e.g. the hero cake), or remove the frame and keep only the board with "PAGE INTROUVABLE".

**m5. The Arabic hero ring is timid and touches the photo edge.** Evidence: `scroll/ar-p360-home-00.png`, `ar-p390-home-00.png`. "عيد ميلاد سعيد" is short, occupies about 40% of the arc, and its ascenders kiss the plate bottom at 360px.
- Fix: in `src/components/ui/LetteredBoard.module.css`, raise the AR ring size about 15% and move the AR arc path outwards by about 4 SVG units.

**m6. Facts tiles contradict each other** ("Parts 14 / Personnes 10", "18 / 14"). This is data. Rename the labels to avoid confusion, or show only one (« Pour 10 à 14 personnes »), in `src/app/[locale]/(site)/galerie/[slug]/page.tsx` (facts array).

**m7. "Plus de photos" repeats the hero shot** when the second upload is a near-duplicate (wedding GP-7956). This is data. Optionally hide the strip when it would show a single tile.

**m8. "réf. GP-R909" appears twice in the first viewport of each detail page** (meta line and plate badge). Keep the badge and drop the ref in the meta line, or the reverse.

**m9. Ref codes mix `0` and `O`** (GP-0SQK, GP-08FY). In `src/lib/cake-ref.ts`, map 0→`Z`-style or use an unambiguous alphabet (Crockford base32 without 0/O/1/I). This matters because people read refs aloud on the phone.

### POLISH

**p1. English copy** (`messages/en/home.json`):
- "Name tiramisu" → « Tiramisu with their name »;
- "Already celebrated in Sidi Bel Abbès" (calque of « Déjà fêtés ») → « Celebrated in Sidi Bel Abbès »;
- UK "colours" vs US "MOM": pick one (UK: "MUM").

**p2. Card names wrap to 3 lines at 390px** ("Création Colorée Personnalisée", "Tarte Cocomelon Lighting bus"), which makes the grid ragged. Either shorten the titles (data) or clamp to 2 lines in `src/components/ui/CakeCard.tsx` with `text-wrap: balance`.

**p3. Chevrons on ghost buttons** ("Voir toutes les créations ›", "Voir les créations ›" on 404) sit close to B's "no → appended to links" ban. Drop them on text CTAs and keep them only in the menu rows.

**p4. The footer is about 1.6 phone screens long** of single-column links (`scroll/fr-p390-home-05..06.png`). Put "Explorer" and "Suivre" side by side in 2 columns on mobile.

---

## PASS / FAIL table

| Item | Result | Evidence |
|---|---|---|
| First impression: H1 + real photo + WhatsApp CTA in first viewport, 390×844 and 360×740, fr/ar/en (home) | **PASS** | `scroll/*-p390-home-00.png`, `*-p360-home-00.png` |
| Premium, specific brand (not a template) | **PASS** (home), **PARTIAL** (tiramisu) | home vs `interact/fr-tira-1.png` |
| One signature moment per page | **PASS** home (piping + live name), **PASS** gallery (card→plate VT), **PASS** detail (re-pipe), tiramisu not verified past step 1 | `interact/*-hero-*`, `*-vtslow-*` |
| DESIGN fidelity: tokens, type roles, scallop, U-mat, piping colours, écrin uses | **PASS**, except wedding gallery écrin (m1) and wedding name field (m2) | `interact/fr-wedding-0.png` |
| Anti-generic list (no blur-fade, gradients, glass, emoji, blobs) | **PASS** | all shots |
| Imagery treatment (watermarks, soft photos, bad images) | **FAIL** | B1, M3 |
| Conversion: WhatsApp one tap on phone, every page | **PASS** (sticky bar + hero/brief); tiramisu step 0 has no WA path (M5) | `log.json` |
| Conversion: context in pre-filled messages | **PASS** detail (title + ref + name + URL + locale), home (name); **PARTIAL** wedding filter (generic), desktop header pill (generic) | `interact/log.json` |
| Desktop: cake-specific CTA above the fold on detail | **FAIL** | M1 |
| RTL mirroring (layout, menu, chips, arrows, sticky call button, ring bidi) | **PASS**. Grep for physical utilities in public components returns nothing. | `interact/ar-menu.png`, `ar-hero-latin.png` |
| Arabic typography (Lalezar/Readex, no tracking/caps on Arabic) | **PASS** on AR pages; **FAIL** for Arabic input on FR/EN pages (M2) | `interact/fr-hero-arabic.png` |
| Arabic copy naturalness | **PARTIAL** | M7 |
| French / English copy (UI strings) | **PASS** FR, **PARTIAL** EN (p1); owner data FAIL (M4) | |
| i18n key parity | **PASS** (353/353/353 keys across fr/ar/en) | |
| ONE maison across home / gallery / detail / tiramisu | **PARTIAL**: tiramisu diverges | M5 |
| 404 | **PARTIAL** | m4 |

## 5 highest-leverage fixes

1. **Clean the content (B1, B2, M4):** delete the chat screenshot, regenerate slugs with 301s, and do one FR/AR title copy pass in the admin. No code, the largest trust gain.
2. **Desktop detail CTA (M1):** put "Commander ce gâteau" under the name field in `src/components/gallery/CakeStudio.tsx`.
3. **Arabic names on FR/EN pages (M2):** add a weighted Arabic fallback in `src/components/ui/LetteredBoard(.module.css)` and `NameField.tsx`, and stop tracking on RTL runs.
4. **Arabic voice pass (M7):** pick one form of address and fix the calques in `messages/ar/{common,cake,gallery,home,how_to_order}.json`.
5. **Tiramisu visual pass (M5):** shorter stage, full-width product cards, a readable disabled CTA and a WhatsApp escape in `src/components/tiramisu/TiramisuWizard.tsx` / `tiramisu.module.css`. Then the wedding écrin moment on `?c=wedding` (m1) in `GalleryFilter.tsx`.
