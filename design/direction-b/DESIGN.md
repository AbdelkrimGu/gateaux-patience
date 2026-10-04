# Direction B: "Écrit en sucre" (Written in sugar · مكتوب بالسكّر)

> **The idea in one sentence:** almost every Gateaux Patience cake carries someone's name piped in bold sugar letters around its board, so the site works the same way: the visitor's celebration, and the name they type, is the headline. It is written in sugar letters on a scalloped cake board and then carried into the WhatsApp order.

Mockups: `mock.html` (FR) and `mock-ar.html` (AR, real RTL). Screenshots are in `shots/`.

---

## 1. Why this fits this brand and these photos

I looked at all 64 photos in `public/images/Cake1–19` and the logo. What they have in common is not a colour. It is **lettering**:

| Cake | What is written on it |
|---|---|
| Cake1 Cocomelon | WASSIM, HAPPY BIRTHDAY around the board |
| Cake2 Minnie | MALEK |
| Cake3 | أمّي, in red brush Naskh |
| Cake4 heart | HAPPY B-DAY SARAH, piped in raspberry |
| Cake6 Spiderman | DIDO, JOYEUX ANNIVERSAIRE curved round the board |
| Cake7 | PRINCESSE GHITA, curved round the board |
| Cake8 | CHEMSEDDINE |
| Cake10 cakesicles | K-E-N-Z-A, one letter per cakesicle |
| Cake12 unicorn | YOUTA 8, on the gold board |
| Cake15 / 18 | FÉLICITATION KAWTHER, CONGRATULATION INES, FÉLICITATION WISSEM |
| Cake16 | JOYEUX ANNIVERSAIRE MEHDI, around a heart board |
| Cake17 / 19 | MON AMOUR, MON HÉROS |

The tiramisu product is literally **a name in white-chocolate letters**, and the repo's `letters/` set exists for it. So personalisation is the product, and the cake board with curved lettering is her signature layout. The direction turns that habit into the brand system. No generic pâtisserie mood is borrowed.

Two more things come straight from the photos:
- **The black sequin backdrop.** She shoots half her cakes on it. It is also the black of the logo, and it becomes the ink (`--paillette`) and the dark "steps" band, with a faint sequin dot texture.
- **Scalloped and holographic cake boards** (Cake4, Cake6, Cake19). The scallop is the one shape motif.

**Brand family:** the raspberry of the logo's drip is the CTA colour. The copper of the logo equals the gold of the unicorn horn. Copper is the ornament colour on dark, and the crown is the mark. It is the same family as the dark copper logo, seen in daylight.

**It also works for weddings.** The ring reads "Félicitations Amel & Yacine" or "Mabrouk", in copper on a sucre board. The photo is set large, and nothing on the page is childish: no rounded "fun" font, no confetti, no pastel blobs. The joy comes from the cakes' own colours, held one at a time.

## 2. The ONE memorable thing: *la bordure* (the lettered board)

The hero cake photo sits in a cake-tin-shaped frame (rounded top, round bottom) on a **scalloped sugar board**. The celebration message is **piped around the bottom arc** in display type, just like her real boards. The visitor **types the name**, and three things follow:
1. The lettering re-pipes onto the board.
2. The same name appears in white-chocolate letters on the tiramisu tile.
3. The WhatsApp CTA pre-fills with `Prénom à écrire : …`.

So the memorable moment is also the conversion device: the order brief starts in the hero. It costs about 20 lines of vanilla JS, and the H1, photo and CTA never depend on it.

## 3. Palette

Core tokens, sampled from the photos (median-cut on saturated pixels) and adjusted for AA where needed:

| Token | Hex | Sampled from | Role |
|---|---|---|---|
| `--sucre` | `#F7F2F4` | fondant white in Cake3 and Cake12, cool-pink, **not cream** | page background |
| `--paillette` | `#16131D` | the black sequin backdrop (`#13121B`), the logo black | text, dark band, chips |
| `--framboise` | `#B8174F` | piped "SARAH" letters (`#C01E57`), deepened for AA; the logo drip | WhatsApp CTA, ring lettering, focus |
| `--dragee` | `#F6D5E1` | buttercream roses (`#E093B9`), lightened | scalloped board, name field, sweets band |
| `--cuivre` | `#C4864A` | unicorn horn (`#D08D4E` / `#DFAC5E`) = logo copper | numerals and ornament **on dark only** |

**Piping set (data, not chrome).** Each cake record stores one `piping` text colour and one `tint` mat colour, picked from that cake. The card title and mat use them, so the colour on the page always comes from the cake you are looking at.

| Name | piping (text, AA on sucre) | tint (mat) | Source |
|---|---|---|---|
| bleu | `#0A6CB5` | `#DCEAF6` | Spiderman fondant `#0874C1` |
| lilas | `#7A4FA6` | `#ECE2F5` | princess tiara `#AE8BCA` |
| menthe | `#137A68` | `#D6F0E9` | Minecraft grass `#42CAAD` |
| rouge | `#A3131B` | `#F7DCDC` | hearts and ribbons `#9D171D` |
| or | `#9A6416` | `#F6E9D2` | unicorn gold `#DFAC5E` |

**Contrast checks (WCAG 2.x, computed):**

| Text pair | Ratio | Result |
|---|---|---|
| paillette on sucre | 16.56 | AAA |
| framboise on sucre | 5.79 | AA |
| white on framboise (CTA) | 6.42 | AA |
| framboise on dragée (ring on board, name field) | 4.74 | AA |
| paillette on dragée | 13.56 | AAA |
| cuivre on paillette | 5.99 | AA (step numerals) |
| bleu on sucre | 4.96 | AA |
| menthe on sucre | 4.73 | AA |
| lilas on sucre | 5.42 | AA |
| rouge on sucre | 7.11 | AA |
| or on sucre | 4.51 | AA |
| **cuivre on sucre** | **2.77** | **fails, so copper is never used for text on light** |

WhatsApp green is deliberately **not** used. The WhatsApp glyph plus the words "Commander sur WhatsApp" carry the recognition, and the CTA stays in brand raspberry. This is a test hypothesis: A/B it against `#1FAF5A` once analytics exist.

## 4. Type system

At most two families per locale, both from Google Fonts. Body text uses one family in every locale, so the file is cached when someone switches language.

| Role | Latin (FR / EN) | Arabic (AR) |
|---|---|---|
| Display | **Dela Gothic One** (one weight) | **Lalezar** (one weight) |
| Body / UI | **Readex Pro** (variable 300–700, using 350 / 500 / 600) | **Readex Pro** (same file family, Arabic subset) |

**Why these fonts:**
- **Dela Gothic One** is a heavy, slightly quirky Japanese-foundry gothic. Its fat strokes and tight counters look like fondant letters cut out and laid on a board, and it carries the "playful Japanese patisserie" energy without being comic or rounded. Google serves it by `unicode-range`, so FR/EN pages only download the Latin slice, not the Japanese glyphs.
- **Lalezar** (Borna Izadpanah) is drawn from Persian and Arabic film-poster lettering. It is hand-lettering heritage, matches Dela's colour and weight, and still looks dignified for « مبروك » on a wedding page.
- **Readex Pro** (Lexend-derived) is legible on low-DPI Android screens, has matched Arabic and Latin metrics, and is not Inter.

**Scale** (px, size/line-height):

| Style | FR at 390 | FR at 1440 | AR at 390 | AR at 1440 |
|---|---|---|---|---|
| H1 | 36–38 / 1.0 | 88–92 / 1.0 | 44 / 1.12 | 100 / 1.12 |
| H2 | 29 / 1.05 | 52 / 1.05 | 34 / 1.2 | 58 / 1.2 |
| Band title | 24 / 1.05 | 30 | 28 / 1.2 | 36 |
| Card name | 21 / 1.05 | 26 | 25 / 1.2 | 30 |
| Ring lettering (SVG units, scales with the plate) | 23, +6 % tracking | | 33, no tracking | |
| Body | 16 / 1.55 | 17–19 / 1.55 | 17 / 1.8 | 18–20 / 1.8 |
| Small / meta | 13 / 1.4 | 13 | 14 / 1.6 | 14 |

Tracking on Latin display is −0.02 to −0.025em. Lines stay at 38ch or less.

**Arabic-specific rules:**
- Arabic display is set about 15 % larger than the French equivalent, with line-height 1.12–1.2. Lalezar's ascenders need the room.
- Never use letter-spacing, uppercase transforms or per-letter animation on Arabic.
- Body text is 17 px with line-height 1.8.
- Western digits (2018, 4 سنوات), which are the Algerian norm.
- Ref codes and phone numbers go in `<bdi>` or `.ltr` (`direction:ltr; unicode-bidi:isolate`).
- The Latin brand name gets `lang="fr" dir="ltr"`.
- Arabic copy is MSA. Darija warmth is optional for the WhatsApp greeting, and the owner validates it.

**Uppercase is used only in the ring lettering**, because it reproduces her boards. That makes it content, not a label. There are no caps labels or eyebrows anywhere.

## 5. Spacing and grid

- **Scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96 px.
- **Mobile:** 16 px gutter, single column. The "what we make" bands go **full-bleed** (edge to edge, no radius, no gaps between bands), like candy stripes. The cake grid is 2 columns with a 12 px column gap and a 24 px row gap.
- **Desktop (≥ 900 px):** 48 px gutter, max width 1240.
  - The hero is two columns (1.15 : 0.85). The plate is at most 380 px, so the 718 px photo is never upscaled beyond about 1.9× DPR.
  - The bands become one 3-column striped block with a 36 px outer radius.
  - The cake grid has 4 columns.
- **Rhythm:** sections are separated by 48–96 px of space and changes of colour field. There are no hairline rules anywhere.
- **First viewport at 390×844:** H1, a real photo and the WhatsApp CTA are all visible, which I verified. At 360×740, `max-height:760px` shrinks the plate so the CTA still shows (`shots/mock-360x740-viewport.png`).

## 6. Imagery treatment (718×960 home-kitchen JPEGs)

- **Hero "plate".** Full 3:4 frame (718/960), radius 22 px on top and an elliptical round bottom (`border-radius: 22px 22px 50% 50% / 22px 22px 37.4% 37.4%`). The round bottom echoes the cake drum and **crops the cluttered lower corners** (sequin fabric, table edges). It sits on the scalloped dragée board.
- **Cards.** 4:5 crop, with the cake roughly 12 % below the top. The frame is a "cake-tin" U: `18px 18px 50% 50% / 18px 18px 30% 30%`. The mat behind is the cake's own `tint`, so letterboxing reads as intentional.
- **Category tiles.** A circle crop at 150 px (mobile) or 220 px (desktop). It **bleeds off the band edge** (`margin-inline-end:-74px`), with a 6 px translucent sugar ring around it.
- **CSS grade, all photos:** `filter: saturate(1.06) contrast(1.04) brightness(1.02)`. It is gentle and lifts the flat Facebook compression. Do the real grade (white balance, background desaturation) in the export pipeline from 04 §5.2. CSS cannot fix the orange or green casts.
- **Never:**
  - background removal (it leaves halos on 718 px files);
  - full-bleed photos at 1440;
  - patterns behind food;
  - the sequin texture behind a photo.
- **Watermarks.** The "gâteaux patience" watermarks show at card size. Ask for originals, or crop or inpaint them. This is the top photo task.

## 7. Components

- **Buttons:**
  - Pill shape (`999px`), 56 px tall (52 in the bar).
  - Primary is framboise with white text and a 22 px WhatsApp glyph.
  - Ghost is a 2 px inset outline in paillette.
  - On dark, the button stays framboise.
  - `:active` scales to 0.97 over 160 ms.
  - Focus ring: 3 px framboise, 3 px offset.
  - Labels say exactly what happens ("Commander sur WhatsApp", "Voir toutes les créations").
- **Cake card:**
  - U-mat photo, then the **name** (what is piped on the cake; if nothing is written, the occasion) in Dela with the card's `piping` colour.
  - One line of Readex 13 px: theme and age or occasion.
  - The ref code `GP-006` in 12 px, 500 weight.
  - The whole card is one link. There is no hover lift or shadow (avoiding the SaaS card kit).
  - Owner consent needed: see Weaknesses.
- **Header:**
  - Crown mark (from the logo, simplified to an SVG disc) plus the "Gateaux Patience" wordmark in Dela.
  - Language switch: FR / ع / EN as 32 px circles, with the current language in a filled paillette circle.
  - Hamburger at 44 px.
  - Desktop adds four text links and a compact "Commander" pill. **The order button is never hidden on mobile**, because the sticky bar covers it.
- **Sticky mobile order bar:**
  - Sucre background with a 1 px top shadow, and a safe-area inset.
  - "Commander sur WhatsApp" (flex 1) plus a 52 px paillette call button (`aria-label` includes the number).
  - It slides in with `animation-timeline: scroll(root)` between 420 and 520 px, so it doesn't duplicate the hero CTA. Without support, it is always visible. It is hidden at 900 px and up.
- **Name field:**
  - A white pill holding a label and a dragée inner pill input in Dela, coloured framboise, max 14 characters.
  - The value flows to the ring, the tiramisu tile and the `wa.me?text=`.
- **Chips** (gallery filters: Anniversaire, Fiançailles, Mariage, Naissance, Réussite, Tiramisu):
  - 36 px pills on dragée. The selected chip is paillette with sucre text.
  - A small dot in the category's piping colour.
  - The row scrolls horizontally on mobile with `scroll-snap`. No icons.
- **Steps band** (a real sequence, so numbers are allowed):
  - Paillette background with a two-layer 1 px dot "sequin" texture: white at 7 % and copper at 10 %.
  - Copper Dela numerals, Readex text, and one CTA.

## 8. Motion language

**Tokens:**

| Token | Value |
|---|---|
| `--d-fast` | 160 ms (press feedback) |
| `--d-base` | 280 ms (sheets, chips) |
| `--d-pipe` | 1400 ms (lettering) |
| `--ease-pipe` | `cubic-bezier(.65,.05,.36,1)` |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` |

**Rules:**
- CSS first.
- All signature motion is inside `prefers-reduced-motion: no-preference`.
- The H1 and LCP image never animate.
- There are no section reveals, no hover lifts and no marquee.

**One signature moment per page:**

| Page | Signature moment |
|---|---|
| **Home** | *The board is piped.* The ring lettering draws as an outline (`stroke-dashoffset` on the whole SVG `<text>`), then fills in, 1.4 s after a 350 ms delay. It replays when the visitor types a name. It works for Arabic because the whole run is stroked; nothing is split per letter. Mid-frame: `shots/mock-390-signature-midframe.png`. |
| **Gallery** | *Card to plate.* A same-document View Transition morphs the tapped card's U-mat into the detail page's plate, and the name slides onto the board. Progressive: without View Transitions it is a normal navigation. Chip filtering is instant, with no animation. |
| **Cake detail** | *Your words on this cake.* The board shows that cake's real message ("Mon héros"). The "Écrire mon prénom" field re-pipes it and pre-fills a WhatsApp brief that includes `GP-xxx`, the date and the number of guests. |
| **Tiramisu** | *Letters land in the cocoa.* Each white-chocolate letter (image sprites, so per-letter animation is fine here) drops 8 px with a 60 ms stagger and a tiny cocoa "puff" (an opacity and scale ring). In RTL the order is unchanged, because the letters are Latin LTR. |

## 9. Iconography

- A custom set of about 10 icons: menu, close, phone, chevron, calendar, guests, gift, pin, Instagram, plus the WhatsApp glyph. They use 2 px rounded strokes on a 24 grid in `currentColor`.
- Only the WhatsApp and phone glyphs are filled.
- The **crown** is the only brand ornament (logo mark and favicon), and the **scallop** is the only shape motif.
- No emoji, no sparkles and no confetti.
- Directional icons (chevrons, back) mirror in RTL. The phone, WhatsApp and logo icons never mirror.

## 10. RTL rules

- Use `dir="rtl"` on `<html>` and logical properties only: `margin-inline`, `padding-inline`, `inset-inline-start`, `text-align:start`. **Never** use `flex-row-reverse` or `left`/`right` in UI CSS. The mock follows this. The only exceptions are symmetrical offsets like the ring's −13.33 %, which are also written logically.
- The hero plate moves to the left column automatically. The band photos bleed off the left edge, and the sticky bar's call button sits on the left.
- Ring lettering: same arc path (left to right through the bottom); the browser's bidi handles Arabic shaping on `textPath` (verified in Chromium screenshots). The default name is Arabic (يوتا).
- Latin-only content inside Arabic (tiramisu letters, ref codes, phone numbers, brand name) is wrapped in `dir="ltr"` elements. The mock had a bug where YOUTA reversed to ATUOY; isolating the letters in a `dir="ltr"` span fixed it.

## 11. Banned in this direction

- Cream + high-contrast serif + rose (the current site) and Playfair, Cormorant, Fraunces, Instrument Serif, Great Vibes and script fonts.
- Inter, Roboto, Poppins, Montserrat, Cairo, and rounded "fun" fonts (Baloo, Fredoka, Comic-likes).
- Confetti, sprinkles, blobs, gradient washes, glassmorphism, sparkle emoji, and gold-gradient text.
- Tracked caps eyebrows, "A · B · C" meta strings, "WORD — fragment" captions, "→" appended to links, and numbered sections other than real steps.
- Fade-and-slide-up on every section, hover lifts on cards, marquees, parallax, blur-in, and animating the H1 or the LCP image.
- Copper text on light backgrounds, and more than one piping colour per card.
- Invented prices, lead times, reviews or counts.
- Spinning circular "badge" text: the ring is static, tied to a board shape, and never rotates.

## 12. References (real-world, attribute borrowed)

1. **Coca-Cola, "Share a Coke" (2011 on).** The customer's own name as the hero of the product, which is what makes it personal and shareable. The name field, the ring and the pre-filled WhatsApp message come from this.
2. **Milk Bar (Christina Tosi), website and packaging.** Each product gets a loud flat colour field, with heavy display type sitting on it, and the joy comes from colour blocking rather than decoration. The full-bleed "what we make" bands and per-cake tints come from this.
3. **Glossier product pages.** Inconsistent product photography is unified by a per-product tinted mat. The `tint` behind each U-mat, which lets amateur photos with different backgrounds sit together as a set, comes from this.

## 13. Honest weaknesses

- **Dela Gothic One is loud.** On `/mariage` it should be set smaller, with more space, in paillette, and with the ring in copper on sucre. If the owner finds it too young, swap the Latin display for a heavier cut that pairs with Lalezar and keep everything else.
- **Real children's names.** These are public on her Facebook, but publishing them as card titles needs the parents' consent. The fallback is the occasion or theme ("Spiderman, 4 ans"). Ask the owner.
- **The tiramisu letter set is Latin-only.** An Arabic name cannot be previewed on the tiramisu. The AR mock falls back to a sample. Owner question: does she make Arabic letters?
- **Data work is needed.** Each cake needs a `piping` and `tint` colour (about 1 minute per cake with an eyedropper) and its board text.
- **The photos are soft and watermarked.** The design frames them well but cannot hide that at 2× DPR. Originals are still on the critical path.
- **The hero CTA sits low in the first viewport** (about 700–760 px on a 390×844 phone). It is visible, but on very short screens with browser chrome it relies on the short-viewport rule and the sticky bar.
- **The wordmark looks different on the Arabic page.** There the Latin "Gateaux Patience" renders in Lalezar's Latin, not Dela Gothic One, to stay within two families. In production, use an SVG wordmark so it is identical in every locale.
