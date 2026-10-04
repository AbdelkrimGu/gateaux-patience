# Direction A — « Écrin »

**The idea, in one sentence:** the site is her black-velvet backdrop. Each cake sits in a copper-bezelled *écrin* (jewel case), and a single raspberry glaze, poured straight from the logo, marks the one thing to do.

Mockups: `mock.html` (FR) and `mock-ar.html` (AR, real RTL). Screenshots: `shots/` (390×844 @2x viewport, full page and scrolled-with-order-bar; 1440×900 viewport and full page).

---

## 1. Why this fits the brand and these photos

- **It comes from the logo, not from "pâtisserie = ivory".** The logo is a near-black textured board, copper/rose-gold metal, a raspberry drip glaze, a crown and sparkles. Écrin keeps the board (the page ground plus a faint static noise texture), the metal (copper type, bezels and the crown mark) and the glaze (the only saturated colour). At the end of the page the real logo PNG sits on the page with no box around it, because its background *is* the page colour. That shows the system was derived from the logo, not dropped on top of it.
- **It comes from her photos.** About a third of the catalogue (Cake1, 3, 4, 12, 13, 17, 18) is already shot on black sequin cloth. She chose a dark, glittering ground herself. On Écrin those photos run straight into the page (the hero photo's sequin cloth fades into the background). The white-wall photos (Spider-Man, princess crown, popsicles) go into a dark mat with a copper bezel, so they read as lit shop windows rather than bright holes.
- **It fits the colourful kids' catalogue.** Cocomelon, Spider-Man, Minecraft and unicorn cakes are saturated. On cream they fight the page. On a warm black they glow like sweets in a jewel case. A dark ground is the most neutral background for a mixed, colourful catalogue, and the same frame still looks premium for engagement, wedding and graduation cakes.
- **It is distinct in Algeria.** Local bakery pages are white, pink or Facebook-blue. A black, copper and raspberry house is easy to remember and matches what customers already see on her packaging, logo and `/contact` page.

## 2. The ONE memorable thing: the glaze

A raspberry drip glaze runs along the top edge of the hero cake photo. On load it **pours**: 8 drips stretch down at different speeds, like syrup, and settle. It is exactly the drip on the logo's cake.

- The glaze appears **once per page**, at full size, on the main photo. Its colour is the **action colour**: the WhatsApp button is "glaze" too, so raspberry always means *this one, order it*.
- Everything else is quiet: copper, cream and black.
- Gravity has no reading direction, so **the glaze never mirrors in RTL** (deliberate; see the AR screenshot).
- The drip is CSS-only (`transform: scaleY` on SVG groups) and runs at the compositor level. It doesn't touch the H1 or the image, so it adds no LCP delay. With reduced motion it renders already poured.

## 3. Palette

| Token | Hex | Role |
|---|---|---|
| `--velours` | `#140F0E` | Page ground. Warm black-brown, like her sequin cloth and the logo board. Deliberately **not** #000/#111. |
| `--ecrin` | `#221A18` | Raised surfaces: photo mats, sheets, the selected language pill |
| `--cuivre` | `#C8875E` | Copper: crown mark, icons, bezels (at 42% alpha), small display accents |
| `--or-rose` | `#E8B591` | Rose-gold: wordmark, text links, ref-code hallmarks, focus ring |
| `--framboise` | `#BE1C45` | Raspberry glaze: the hero glaze plus **every primary CTA**, nothing else |
| `--creme` | `#F4E8DC` | Text, H1, selected chip |
| `--sucre` *(support)* | `#A39287` | Muted text: captions, occasions, helper lines |

Decorative only: `--glaze-deep #7E0C2A` (glaze shading), and the copper gradient `#E8B591 → #C8875E → #9C6440`, used **only** inside the small crown SVG.

**Contrast (WCAG 2.x, computed):**

| Pair | Ratio | Use |
|---|---|---|
| creme on velours | 15.8 : 1 | body, H1 (AAA) |
| creme on ecrin | 14.2 : 1 | text on mats |
| or-rose on velours | 10.4 : 1 | links, wordmark (AAA) |
| cuivre on velours | 6.4 : 1 | small copper text (AA, any size) |
| sucre on velours / ecrin | 6.4 / 5.7 : 1 | muted text (AA) |
| #FFF4EC on framboise | 5.6 : 1 | CTA label (AA) |
| framboise vs velours | 3.1 : 1 | the button shape itself (passes 1.4.11 non-text 3:1) |

Rule: raspberry is **never** used for text on the dark ground (3.1:1). It is a fill only.

## 4. Type system

| Role | Latin (FR/EN) | Arabic (AR) |
|---|---|---|
| Display | **Bodoni Moda** (variable: opsz 6–96, wght 400–700, italic) | **Aref Ruqaa** (400/700) |
| Body / UI | **Readex Pro** (300–600) | **Readex Pro** (same family, Arabic subset) |

That is two families per locale. FR/EN load Bodoni Moda plus Readex Pro (Latin). AR loads Aref Ruqaa plus Readex Pro (Arabic plus Latin for digits and the brand name). Aref Ruqaa has its own Latin, so in AR the wordmark "Gateaux Patience" is set in Ruqaa's Latin and needs no third family.

**Why these:**
- **Bodoni Moda** is a pointed-pen Didone. Its thick-thin modulation is the same tool that drew the logo's script wordmark, but it stays legible and has no "template bakery script" feel. At opsz 96 it reads like jeweller's engraving, which is right for an *écrin*. The italic is used once, for the wordmark and the sign-off line, never to accent a word inside a headline.
- **Aref Ruqaa** is the Arabic counterpart of the logo's script. Ruqʿa is the everyday handwriting of the Maghreb and Mashreq: personal, warm and calligraphic. That is the same job the script does in the logo. It works well for short headlines («للصبر مذاقٌ حلو») and is **never** used for paragraphs.
- **Readex Pro** is one sans for both scripts, with matched metrics. It was built on Lexend's legibility research, has open shapes that hold up on low-dpi Android screens, and its Arabic and Latin share weight and colour. Mixed lines (e.g. «منذ 2018», «GP-013») don't jump. It is not Inter, Roboto or Plex.

**Scale (px):**

| Token | 390 | 1440 | Line-height (Latin / Arabic) |
|---|---|---|---|
| display-xl (H1) | 46 | 112 | 1.0 / 1.25 (AR H1 is set at 56 / 92: Ruqaa's x-height is small) |
| display-l (H2) | 34 | 56 | 1.05 / 1.35 |
| display-m (tile title) | 21–27 | 26–34 | 1.1 / 1.35 |
| title (card name) | 19 | 23 | 1.12 / 1.4 |
| body | 16 (AR 17) | 17–19 (AR 20) | 1.55 / 1.8 |
| small | 13.5 | 14.5 | 1.5 / 1.7 |
| micro (hallmark) | 11 | 11 | 1 |

Display tracking is −0.018 to −0.03 em (Latin only). Body measure is 30–36 ch.

**Arabic-specific rules:**
- `letter-spacing: 0` always. No italic, no uppercase transforms, no letter-by-letter animation.
- Arabic body is **+1 px** over Latin, and line-height rises to **1.8**, to make room for dots and diacritics.
- Use Western digits (0–9), as Algerians do (2018, 5 سنوات). Ref codes and phone numbers are wrapped as LTR isolates (`unicode-bidi: isolate; direction: ltr`).
- Aref Ruqaa is used only at ≥ 19 px and only for headings, card names and the sign-off. Prices, forms and chips stay in Readex Pro.
- Never fake bold, and never use Kashida justification. Text is start-aligned (right in RTL).

## 5. Spacing and grid

- Base unit **4 px**. Steps: 4 · 8 · 12 · 16 · 22 · 32 · 48 · 72 · 96 · 120.
- **Phone:** 16 px gutter, single column. Cards are 2-up with a 12 px gutter and 26 px row gap. Sections are 72 px apart.
- **Desktop (≥ 900 px):** 12-column grid, 48 px gutter, max width 1280. Hero copy spans columns 1–6 and the plate columns 7–12, **capped at 560 px wide** so 718 px originals are never upscaled. Cards are 4-up. Sections are 96–120 px apart.
- Radii, by role: plate 6 px (top corners only), mats 6 px, photos inside mats 2 px, hallmark 3 px, pills (buttons, chips, language switch) fully round. There is no single radius applied to everything.

## 6. Imagery treatment (made for 718×960 Facebook JPEGs)

Real inventory: 33 × 718×960, **11 × 432×774** (low resolution), 11 landscape, the rest are odd sizes. All are watermarked.

1. **One crop: 4:5** (`object-fit: cover`) everywhere except the hero (4:4.7 on phone, pinned to 6% from the top so horns, crowns and toppers survive).
2. **Hero = a sequin-cloth photo only** (A-list: Cake12 unicorn, Cake13 Rapunzel, Cake4 heart, Cake17 hearts, Cake18 graduation). The bottom 40% masks into the page (`mask-image: linear-gradient(#000 60%, transparent)`), so her cloth *becomes* the page. The H1 overlaps the fully faded area by 30 px.
3. **Grid = écrin mat.** Each photo sits in a 6 px dark mat (`#2B211E → #1A1311`) with a 1 px copper bezel on the photo edge. White-wall photos become lit windows in a case. No vignettes and no dark gradients over the photo (they look dirty on white walls).
4. **CSS grade (mock only; bake it into the AVIF pipeline for production):** `saturate(1.06) contrast(1.05) brightness(.95)`. It warms the white walls slightly and deepens the sequins.
5. **Resolution rules:** never show a photo wider than its native pixels ÷ 1 (hero ≤ 560 CSS px on desktop). 432-px-wide files are **grid-only** (≤ 200 CSS px) until originals arrive.
6. **No background removal, no AI upscaling, no stock.** The tiramisu render (`tiramisu/hero/hero-1.png`) is already dark-ground and fits as-is.
7. **Watermarks stay** on the current files. Ask the owner for clean originals and keep the watermark only in the IG export.

## 7. Components

- **Header (phone):** crown mark plus the italic wordmark in rose-gold, an always-visible language pill `FR | ع | EN` (selected = ecrin fill plus bezel), and a two-line menu glyph (short second bar). **Desktop:** four nav links (Créations · Mariage · Tiramisu · Commander). The active link gets a 1 px raspberry underline, which is the only other place the glaze colour appears. A compact glaze "Commander" button sits on the end.
- **Primary button (glaze):** raspberry pill, 54 px tall (58 desktop), cream label in Readex 500, WhatsApp glyph. A 1 px inner highlight on top and a 2 px inner shade on the bottom give a glossy glaze edge. Press = `scale(.97)` over 140 ms. There is **one per screen**.
- **Secondary:** a rose-gold text link with a 1 px copper underline. The ghost button is a copper bezel pill (used only for "see all").
- **Cake card:** écrin mat; **hallmark** (poinçon) bottom-start with the ref code `GP-013` in rose-gold on a 3 px dark plate (the jeweller's stamp, which doubles as the WhatsApp reference); a ♡ "keep" button top-end, 40 px, for the 1–3 cake shortlist; under the mat, the name in Bodoni (Ruqaa in AR), then the occasion in muted Readex. Prices appear on the card only once the owner confirms them (`à partir de …`); until then there is no placeholder.
- **"What we make" tiles:** on phone, custom cakes is the lead tile (photo 52% plus text and a link), with Douceurs and Box tiramisu 2-up below. On desktop they are 3-up at the same 4:5.
- **Chips:** 38 px pills with an inset 1 px copper line at 18% alpha. Selected = solid cream with velours text. They scroll horizontally edge to edge on phone and stick under the header on the gallery page.
- **Sticky mobile order bar:** solid `velours` at 96% (no `backdrop-filter`, which is expensive on low-end Android) with a 1 px copper top line. A glaze "Commander sur WhatsApp" button (flex 1) plus a 50 px round call button with a bezel. It **slides up only once the hero CTA has left the screen** (IntersectionObserver; without JS it is simply hidden and the hero CTA remains), so there is never more than one raspberry action on screen. It respects `safe-area-inset-bottom`. On cake detail it shows the ref (`GP-013`) on the start side.

## 8. Motion language

Tokens:

| Token | Value | Use |
|---|---|---|
| `--ease-glaze` | `cubic-bezier(.22,.9,.18,1)` | Viscous: fast release, long settle. Used for pours, sheets and the bar |
| `--ease-out` | `cubic-bezier(.2,.7,.2,1)` | Taps, small UI |
| `--t-tap` | 140 ms | Press feedback |
| `--t-ui` | 240 ms | Chip and colour changes |
| `--t-sheet` | 420 ms | Order bar, brief sheet |
| `--t-pour` | 1400–2300 ms | Glaze drips (staggered 70 ms) |

No section fade-ups, no marquee, no parallax. Only transform and opacity are animated. Under `prefers-reduced-motion`, everything renders in its final state.

**One signature moment per page:**
- **Home: the pour.** The hero glaze drips stretch and settle once on load. CSS only, not tied to the H1 or LCP.
- **Gallery: the hallmark stamp.** Tapping ♡ presses the card's `GP-xxx` hallmark (scale 1.12 → 1 with a rose-gold flash, 240 ms). The order bar's counter ticks to "Envoyer ma sélection (2)". This is user-triggered.
- **Cake detail: the case opens.** A View Transition morphs the card's mat into the detail photo (CSS `view-transition-name` on the mat, progressive: no API, no animation). A single drip of glaze appears on the detail photo's top edge, the only glaze on that page.
- **Tiramisu: the dusting.** When the box is complete, a fine cacao sift (≈ 60 static particles, one 900 ms CSS fall, `pointer-events:none`) settles over the 2D preview just before the "Envoyer sur WhatsApp" summary. The 3D stays opt-in.

## 9. Iconography

- 24-px grid, **1.6 px stroke**, round joins, `currentColor`. Copper or rose-gold on the ground, cream inside buttons.
- Brand ornaments come **only from the logo**: the **crown** (header mark, favicon, and an 8 px "nouveau" marker) and the **4-point sparkle**, used once as a success tick after a WhatsApp handoff. Never as a separator or bullet.
- The WhatsApp glyph is the recognisable bubble plus handset, drawn in our stroke style. Never official green.
- No emoji in the UI (they are fine inside the generated WhatsApp message).

## 10. RTL rules

- Use logical properties only (`inline-start/end`, `margin-inline`, `padding-inline`). `dir="rtl"` on `<html>`, with no `flex-row-reverse` hacks.
- **Mirrors:** layout (hero copy and plate swap sides), the order bar (call button moves to the left), the hallmark and ♡ positions, chip scroll direction, and directional chevrons.
- **Doesn't mirror:** the glaze (gravity), photos, the WhatsApp and phone glyphs, the crown, ref codes, phone numbers and digits (all LTR isolates).
- Arabic copy is written, not machine-mirrored («اطلبوا عبر واتساب», «خرجت للتوّ من الورشة»). The owner validates the tone, especially the H1 «للصبر مذاقٌ حلو».

## 11. Banned in this direction

- Cream, ivory or blush page backgrounds. Playfair, Cormorant, Inter, Great Vibes, Fraunces. Any script font other than the logo image.
- Gradient or metallic "gold foil" **text**. Metallic gradients are allowed only inside the 32 px crown SVG.
- Raspberry used for text, borders or decoration other than the glaze and CTAs. A second glaze on the same page.
- Pure `#000` / `#111`. Glitter or sparkle particle animations. Blurred colour blobs. `backdrop-filter` on scrolling UI.
- Tracked ALL-CAPS eyebrows, `A · B · C` meta strings, numbered non-sequences, "→" glued to links, one-word italic accents in headlines.
- Fade-up on every section, auto-advancing carousels, scroll-jacking.
- WhatsApp green, emoji icons, fake reviews, invented prices or lead times.
- Background removal or AI upscaling of her photos, and full-bleed 1440 heroes from 718 px files.

## 12. Real-world references (the specific thing borrowed)

1. **Cartier's red box / jewellery-house product pages:** the object shown *inside a case*. Borrowed: the mat plus bezel framing, the hallmark (poinçon) as the product's identity, and one house colour that means "this is ours".
2. **Cédric Grolet (Instagram and site):** one sculpted pastry, centred on a single plain dark ground, almost no copy. Borrowed: the hero discipline. One cake, a big headline, one action, and the photo's ground merging with the page.
3. **Pierre Hermé, "Ispahan":** a raspberry signature used as the brand's emotional colour, plus one CTA verb everywhere ("Je commande"). Borrowed: raspberry as the *only* saturated colour, reserved for the product and the action, and "Commander" as the single verb across FR, AR and EN.

## 13. Honest weaknesses and open risks

- **It sits close to calibration default #2** (near-black plus one vermilion accent). Mitigations: a warm brown-black instead of #000/#111, copper as a second metal, the accent reserved for glaze and action, and the palette taken from her logo and backdrop. A reviewer may still read it as "dark luxury template".
- **Dark sites print badly and can feel "nightclub"** to some wedding clients. A cream "tirage" variant for `/mariage` invitations or printouts might be needed.
- **The hero depends on a sequin-cloth photo.** White-wall photos don't dissolve well. The hero must be curated from the A-list (5 suitable images today).
- **Watermarks and low-res 432 px files** remain visible. The direction flatters them but can't fix them. Originals are still on the critical path.
- **Aref Ruqaa** is expressive. Some readers may find Ruqʿa informal for the wedding page, where Amiri could replace it for headings (same budget). Validate with the owner and two Arabic readers.
- The noise texture is an SVG filter in the mock. In production, bake it to a ≈ 3 KB PNG to avoid filter rasterisation on low-end GPUs.
- Paths: the mock references `../../public/images/...` and `../../public/Logo/Logo.png`. The logo moved from `/Logo` to `/public/Logo` during this session (another agent's change), so update the path if it moves again.
