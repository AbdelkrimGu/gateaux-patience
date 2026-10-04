# 04 — Brand, UX & Conversion Strategy for the Gateaux Patience Revamp

*Research date: 2026-10-04. Scope: art direction, information architecture, conversion psychology, photography and Algeria/MENA specifics for a custom-cake designer whose orders arrive by WhatsApp. No code was changed.*

---

## TL;DR

1. **The site currently looks like a good bakery template, not a maison.** Rose + gold gradients, blurred colour blobs, dotted patterns, emoji-style icons, four font families and a 928-line animated "constellation" hero all say "theme". The best patisserie sites (Pierre Hermé, Ladurée, Cédric Grolet, Fabrique, Little Tart) say "premium" through **restraint**: one or two typefaces, a quiet palette, big photography and lots of white space.
2. **The biggest conversion leaks are practical, not visual:**
   - On mobile the "Commander" button sits inside the hamburger menu (`hidden md:flex` in `Header.tsx`).
   - There are **no prices, not even "à partir de"**, and **no lead time** anywhere.
   - The header and "How to order" WhatsApp links open a **blank chat** with no context.
   - Nothing tells a visitor about delivery or pickup, payment (cash), deposits for weddings, or the area served.
3. **Make WhatsApp the checkout, and make it smart.** Every cake gets a reference code (e.g. `GP-042`). A mobile sticky bar ("Commander sur WhatsApp" + "Appeler") is always within thumb reach. An optional 3-field "brief" (date, number of guests, occasion) writes a structured WhatsApp message, so the owner never has to ask "which cake? for when? how many?". WhatsApp is the dominant messenger in Algeria (about 27 M weekly users in Q4 2025), and 85–95 % of Algerian online purchases are paid cash on delivery. That is where the conversation already lives.
4. **Recommended art direction: "Maison Patience", an editorial Parisian-maison structure with restrained Algerian-heritage accents** (zellige star motif, arch-shaped image masks, a teal-and-saffron accent palette). Fonts: **Cormorant Garamond + Amiri** for display, **IBM Plex Sans Arabic** (covers Latin and Arabic) for UI and body. That cuts the current four families to three, and only two load per locale.
5. **Honest social proof, no fabrication:**
   - Real Instagram follower count and Reels
   - "Depuis 2018"
   - "Photographed at the real event" captions
   - A link to real Google reviews once they exist
   - A post-delivery WhatsApp routine that collects consented photos and quotes from now on
6. **Photos:** the 172 image files are Facebook-recompressed 718×960 JPEGs (`FB_IMG_*`), about 40 MB. Don't cut out backgrounds or AI-upscale them aggressively, because that looks fake at this resolution. Instead: one consistent 4:5 crop, one colour grade, clutter inpainting, AVIF output, blur placeholders, and a curated "A-list" of about 12 hero images. Ask the owner to send **originals** (Drive, or WhatsApp "document" mode) and to follow a simple shot list.
7. **Build a seasonal engine:** Ramadan (about 8 Feb – 9 Mar 2027), Eid al-Fitr (about 9–10 Mar 2027), Eid al-Adha (about 16–17 May 2027), BEM and Bac results (June / mid-July, which drive graduation-cake demand), summer wedding season, Yennayer (12 Jan), New Year. A homepage "saison" slot and an Instagram-aligned calendar.

---

## 1. Benchmark: what best-in-class patisserie sites do

### 1.1 Site-by-site

| Site | What makes it work | Ordering model | Steal for Gateaux Patience |
|---|---|---|---|
| **Pierre Hermé** (pierreherme.com) | Navigation is the product taxonomy (Macarons, Chocolats, Pâtisseries, Cakes…). Category tiles with photography come straight after the hero. One repeated CTA verb ("Je commande"). A brand word ("Infiniment") is used as a leitmotif. Service guarantees (click & collect, 24–48 h delivery) sit near the footer. | Full e-commerce with cart, delivery threshold and click & collect | One consistent CTA verb everywhere ("Commander"). Service guarantees as a slim reassurance strip. A recurring brand word ("Patience" is already a gift: *"La patience a bon goût"*). |
| **Ladurée** (laduree.com) | Heritage line ("Depuis 1862") used as a trust anchor. Seasonal collections lead the homepage. **"Composez votre coffret"**: a configurator presented as a homepage section, not hidden. Cold-chain and packaging reassurance. | E-commerce, delivery or boutique pickup | Put the **tiramisu configurator on the homepage** as "Composez votre box". Use "Depuis 2018" as the heritage line. A seasonal block at the top of the homepage. |
| **Dominique Ansel Workshop** | Clear, plain operational copy: *"Please reserve 48 hours of advance notice…"*. Separate entries for boutique, local delivery and events. | Pre-order with an explicit lead time | **State the lead time in plain words** on every cake page and in the sticky bar. |
| **Cédric Grolet** (cedric-grolet.com) | Almost no copy; imagery dominates; navigation by place and experience. Luxury through scarcity and minimalism. Each pastry shot as a single sculptural object on a plain ground. | Mostly in-store / pre-order | The photography treatment: **one cake, one plain ground, centred, lots of air**. Sparse copy. |
| **Peggy Porschen** (peggyporschen.com) | Wedding cakes presented as a **named collection** ("Pink Romance", "La Vie En Rose", "The Belgravia"…) with a short flavour list. Enquiry by email to discuss requirements and lead times. | Enquiry-led for bespoke | **Name the signature designs.** A name turns a photo into a product ("Le Jardin de Lina" instead of "Gâteau mariage 3 étages"). Present wedding as a collection plus a consultation. |
| **Lily Vanilli** (lilyvanilli.com) | Mega-menu "Order" grouped by occasion and type (Cakes, Wedding, Cupcakes, Kids, Seasonal…). Press quotes as social proof. Product cards show prices (about £70–80). | E-commerce for standard items, enquiry for bespoke | Show **"from" prices** on standard items. Group navigation by **occasion**. |
| **Magnolia Bakery** | Organised by **occasion** rather than product type (cited as a conversion driver by Krishaweb's 2026 review). Strong seasonal promos. Pre-order windows with dates. | E-commerce plus catering team | Occasion-first IA (already partly there). Dated seasonal pre-order windows ("Commandes Aïd jusqu'au 5 mars"). |
| **Fabrique Bakery** (fabrique.se) | Design restraint signals premium. | E-commerce / stores | Kill decorative noise (blobs, dot patterns, gradient text). |
| **Little Tart Bakeshop** (littletartatl.com) | White space carries the premium feel. | Online order | Generous section spacing, fewer cards per row. |
| **Debaere** (debaere.co.uk) | A concise positioning line ("Pure Joy, Baked In") replaces paragraphs. | — | Replace the generic "Des gâteaux qui racontent votre histoire" with a sharper line (see §2). |
| **Levain Bakery** | Very large product photography as the homepage. | E-commerce | One full-bleed hero photograph rather than an animated collage. |
| **Owl Bakery** | An illustration system gives recall beyond photos. | — | A small zellige/star illustration system can compensate for imperfect photos. |

### 1.2 Patterns that recur across the best sites

1. **Photography is the interface.** Big, consistent, single-subject images; text never competes with them.
2. **A two- or three-colour palette plus one accent.** Luxury houses rarely use gradients.
3. **One or two typefaces.** Usually a high-contrast serif or a refined sans for display, plus a neutral sans for body.
4. **Occasion-led navigation** for celebration bakeries (Magnolia, Lily Vanilli).
5. **A configurator promoted to the homepage** (Ladurée "Composez votre coffret").
6. **Explicit operational facts:** lead times, delivery and pickup, guarantees.
7. **Named signature products** (Peggy Porschen, Pierre Hermé's "Ispahan", "Mogador").
8. **Heritage as trust:** "Depuis 1862" at Ladurée. For a young brand, "Depuis 2018 · Sidi Bel Abbès" does the same job honestly.

> **Note on Awwwards/Dribbble references.** Awwwards' Food & Drink category is dominated by packaged-food brands (e.g. *Partake Foods*, Honorable Mention Aug 2026). Bakery-specific award winners are rare, and Awwwards-style experiments (WebGL, physics, scroll-jacking; e.g. "The Bakery" physics demo in Awwwards inspiration) often hurt mobile performance. Borrow their **typographic confidence and editorial layouts**, not their heavy motion. The existing 3D tiramisu is already the site's "wow" moment; nothing else needs to compete with it.

---

## 2. Three art-direction directions

All three work in **FR / AR / EN with real RTL**. Every font listed is on Google Fonts. The Arabic choices are designed Arabic faces, not fallbacks.

### Direction A — "Maison Patience" (Parisian editorial maison) ★ recommended base

- **Feel:** a pastry-house catalogue or magazine. Calm, confident, ivory paper, dark ink, photography framed like editorial plates.
- **Typography:**
  - Display, Latin: **Cormorant Garamond** (500/600, italic for accents). High contrast and elegant, a natural fit for "maison".
  - Display, Arabic: **Amiri** (Naskh revival of the Bulaq Press type). Classical, high contrast, the visual sibling of Cormorant.
  - UI/body, both scripts: **IBM Plex Sans Arabic**. It ships Arabic and Latin with matched metrics, so one family covers all body text and avoids mixed-script mismatch inside a sentence.
  - Drop Playfair, Inter, Cairo and Great Vibes. Great Vibes has no Arabic, and script fonts read as "template bakery".
- **Palette:**

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F7F1E8` | page background (warm ivory) |
| `--ink` | `#1F1A17` | text, primary buttons |
| `--cocoa` | `#5A3E2B` | secondary text, links |
| `--blush` | `#E9C9C1` | soft panels, selected states |
| `--gilt` | `#B08D57` | hairlines, small ornaments only (never gradient text) |
| `--whatsapp` | `#1FAF5A` | used only on the WhatsApp action, slightly deepened for contrast |

- **Photography:** 4:5 portrait plates on ivory, thin hairline frames, captions set in small caps ("N° 042 — Le Jardin de Lina — Mariage, 120 parts").
- **Layout signatures:** numbered sections ("01 Créations · 02 Occasions · 03 Tiramisu · 04 Commander"), asymmetric two-column editorial spreads on desktop, single column on mobile, generous 96–128 px vertical rhythm.
- **Risk:** can feel cold or "French-only". Direction B's accents fix that.

### Direction B — "Zellige & Saffron" (Mediterranean / Algerian heritage)

- **Feel:** warm, local and proud. Plaster-white walls, tile geometry, the Andalusian-Maghrebi arch. The repo already contains a `hero-zellige` experiment, which shows the appetite for this.
- **Typography:**
  - Display, Latin: **Fraunces** (soft "wonky" optical serif, warm and artisanal).
  - Display, Arabic: **El Messiri**. A curvy, brush-drawn Naskh-inspired face with a matching Latin, so it can also serve as a bilingual display. Its warmth matches Fraunces.
  - Labels/eyebrows in Arabic: **Reem Kufi** (geometric Fatimid Kufic). Short labels only, because Kufic is tiring in paragraphs.
  - UI/body: **Readex Pro** (Arabic + Latin, built for legibility with the Lexend methodology).
- **Palette:** plaster `#FBF7F0`, zellige teal `#1F6F6B`, deep cobalt `#23407A`, saffron `#E0A43A`, terracotta `#C4623F`, ink `#1E1B18`. Teal or cobalt as primary, saffron for highlights.
- **Ornament system:** an 8-point star (*khatam*) as section divider and bullet, arch-shaped image masks for category tiles, a faint tile pattern at ≤4 % opacity in footer and quote blocks. **Never put the pattern behind food.**
- **Risk:** can tip into "restaurant / tourist" kitsch, and the strong colours fight the pastel cakes. Use it as an accent layer, not the base.

### Direction C — "Fête" (playful pastel, kids and birthdays)

- **Feel:** joyful, sprinkle-bright, rounded. Strong for kids' cakes, cupcakes and cake pops.
- **Typography:** **Baloo Bhaijaan 2** (rounded, Arabic + Latin, playful display) or **Lemonada** (Arabic + Latin). **Marhey** for fun Arabic headlines. Body: **Tajawal** or **Readex Pro**.
- **Palette:** pistachio `#BFD8B8`, strawberry `#F28C9B`, butter `#FBE7A1`, lilac `#CDB8E6`, ink `#2B2233`.
- **Photography:** cut-out-feeling compositions on coloured paper sweeps, confetti props.
- **Risk:** undermines the higher-ticket **wedding/engagement** business, which is where the margin is. Best used as a **sub-theme for the Kids/Cupcakes category pages**, not the brand.

### Recommendation: A as the system, B as the accent, C as a category mood

| Layer | Source |
|---|---|
| Grid, typography, spacing, tone | **A — Maison** |
| Ornament (star dividers, arch masks), one accent colour (zellige teal for links and focus rings, saffron for "nouveau/saison" tags) | **B — Zellige** |
| Kids/Cupcakes category hero colour washes only | **C — Fête** |

**Positioning line ideas** (to replace "Des gâteaux qui racontent votre histoire", which is generic):
- FR: *"La patience a bon goût."* / *"Pâtisserie sur mesure à Sidi Bel Abbès, depuis 2018."*
- AR: *«الصبر حلو»* (a play on the proverb *الصبر مفتاح الفرج*). **The owner should validate the tone.**
- EN: *"Patience, baked in."*

**Font loading budget:** load only the scripts each locale needs. On `/ar`, load Amiri and Plex Sans Arabic (Arabic subset plus Latin for numerals and brand). On `/fr` and `/en`, load Cormorant and Plex Sans Arabic with the Latin subset only. Use variable or limited weights (2 per family max). The current layout declares Playfair, Inter, Cairo and Great Vibes for every locale.

---

## 3. Conversion psychology for a custom-order, WhatsApp-first business

### 3.1 The real funnel

```
Instagram / Google / QR card ─► Home or Cake page ─► "I like this one" ─► WhatsApp chat ─► quote + date confirmed ─► deposit (weddings) ─► pickup/delivery, cash
```

The site's job is **not checkout**. It has three jobs:
1. Inspire and qualify: show the right cakes, set price expectations, state lead times.
2. Hand off a **complete brief** to WhatsApp in one tap.
3. Reassure enough that the visitor actually sends the message.

### 3.2 Friction audit and fixes

| Friction | Today | Fix |
|---|---|---|
| CTA not visible on mobile | Header "Commander" is `hidden md:flex`; mobile users must open the hamburger | **Sticky bottom action bar** on mobile (thumb zone): `[WhatsApp · Commander]` (primary, about 70 % width) + `[📞]` (secondary). Hide it while the keyboard is open and while the configurator's own bar is visible. |
| Blank WhatsApp chats | Header, HowToOrder and SocialCTA links open `wa.me/…` with no text | **Every** WhatsApp link carries context: the page, the cake ref, the locale greeting. |
| "Which cake was it?" | The cake title is sent, but titles can be similar | **Reference codes** (`GP-042`) shown on cards and detail pages and included in the message, plus the page URL so the owner sees the photo preview. |
| Unknown price → fear | "Devis sur demande" everywhere | **"À partir de X DA"** per category and per signature cake, plus a price-per-guest band table (§3.4). |
| Unknown lead time → "too late anyway" | Not stated | "Commandez **au moins 48–72 h** à l'avance · Mariages : **2–3 semaines**" (owner to confirm the numbers), stated on detail pages and the "Commander" page. |
| Unknown logistics | Not stated | Short "Retrait à l'atelier / Livraison à Sidi Bel Abbès (zones)", "Paiement à la livraison ou au retrait", "Acompte pour mariages" (owner to confirm). |
| Back-and-forth in chat | Owner must ask date, guests, flavour | Optional **"Préparer ma demande"** sheet: date (native date picker), number of guests (stepper), occasion (chips), flavour (chips, optional), free note. It builds the WhatsApp text below. Always offer "Écrire directement" as a skip. |
| The form path feels like a black hole | Form → admin panel, no confirmation promise | After submit: "Merci ! Nous répondons sur WhatsApp en moins de X h (9h–20h)" plus a button to also open WhatsApp. |

**Example generated WhatsApp message (FR):**
```
Bonjour Gateaux Patience 👋
Je souhaite commander : GP-042 « Le Jardin de Lina »
📅 Date : samedi 14 novembre
👥 Personnes : 30
🎉 Occasion : Fiançailles
🍰 Saveur : Framboise-pistache
📝 Note : couleurs blanc et sauge
🔗 https://gateauxpatience.com/galerie/le-jardin-de-lina
```
The same template applies in AR, with the right-to-left mark handled by WhatsApp. Keep emojis minimal and functional; they help scanning inside WhatsApp, not on the site.

### 3.3 Configurators as engagement and order-value drivers

- The tiramisu wizard already shows **prices in DA and a running total**. That makes it the only fully transparent product, so promote it like Ladurée's "Composez votre coffret": a homepage section with a looping 3–5 s video or poster of the 3D preview and the CTA "Composez votre box".
- Research on mass customisation supports this. People value self-designed products more (Franke, Schreier & Kaiser, *"The 'I Designed It Myself' Effect"*, 2010), and the IKEA effect shows effort increases valuation (Norton, Mochon & Ariely, 2012). Practical implications:
  1. Let users **name or personalise** the box (the letters feature does this).
  2. Show a **beautiful summary** at the end. Generate a PNG of the 2D preview and share it through the Web Share API to WhatsApp, so the owner receives the visual and the user brags on their own Status or Stories. That is free distribution.
  3. Keep the price visible but secondary, and show "à partir de" before entry so there are no surprises.
- A **"Gâteau sur mesure" mini-configurator** for cakes is the logical next step: occasion → guests → shape/tiers → flavour → colours → inspiration photo. Its output is a WhatsApp brief, not a price, since price stays a quote.

### 3.4 Price anchoring and "starting from" (honest)

- Show **"À partir de"** prices only where the owner confirms them. A table on the "Commander" page is the most honest anchor:

| Format | Parts | À partir de |
|---|---|---|
| Gâteau du quotidien | 6–8 | *X DA* |
| Anniversaire décoré | 10–15 | *X DA* |
| Gâteau enfant à thème | 15–20 | *X DA* |
| Wedding / fiançailles (2–3 étages) | 50–120 | *X DA*, sur devis |
| Box tiramisu personnalisée | — | live price in configurator |

- Order matters: list **wedding first** on the wedding page (it anchors high, so a 2-tier engagement cake feels reasonable) and **daily cakes first** on the general "Commander" page (low entry).
- **Never invent prices or fake strikethroughs.** If the owner refuses to publish prices, publish **price-per-guest bands** ("environ X–Y DA par personne"). That still removes the biggest fear.

### 3.5 Honest social proof (no fabricated testimonials)

| Signal | How | Notes |
|---|---|---|
| "Depuis 2018 · Sidi Bel Abbès" | Hero eyebrow, footer | True and specific. Specificity is persuasive. |
| Instagram | Real follower count (updated manually in admin), a 6–9 tile **static** grid of latest posts linking to IG, Reels poster frames | **Don't use the official embed script.** Third-party embeds add heavy JS and layout shift (web.dev embed best practices; a feed swap cut page weight by about 90 % in one Smash Balloon case). Use static images synced manually or by a cron job. |
| "Photographiée lors de l'événement réel" | Caption on gallery images where true | Real photos of real events *are* the proof. Say so. |
| Volume | "Plus de N créations" only if the owner can count them (e.g. from Instagram posts) | The existing "+100" stat in `StatsBar` (unused) should be verified or removed. |
| Google Business Profile | "Voir nos avis Google" link once reviews exist | Ask happy clients to leave one (post-delivery message). |
| Testimonials going forward | Post-delivery WhatsApp routine: "Votre avis + une photo du moment ? (avec votre accord)". Store consent in admin. | Display only with first name, occasion and month. Screenshot-style WhatsApp quotes **only with explicit consent and with phone numbers removed**. |
| Process transparency | "L'atelier" photos: hands piping, sugar flowers, packaging | Craft visibility builds trust for a home or atelier business. |
| The founder | A portrait or hands-only shot plus a signature line | A face sells custom work. Respect the owner's privacy preference; hands-only works too. |

### 3.6 Trust signals checklist

- Real address or pickup zone, opening hours, and response time for WhatsApp
- Hygiene and ingredients ("beurre, crème fraîche…" — owner to confirm), plus allergens (nuts, gluten, lactose)
- Packaging photo: box and transport (cake boxes are a fear point for tiered cakes)
- Payment: cash at pickup or delivery; deposit for large orders. Stating this up front matches the Algerian norm (COD 85–95 % of e-commerce).
- Cancellation and change policy, in one sentence each
- Legal identity (the trade registry if applicable) and consistent NAP (name, address, phone) with Google Business Profile and JSON-LD (already partly done)

### 3.7 CTA placement rules

1. **One primary action per screen.** "Commander" (WhatsApp) in ink or green. "Voir la galerie" is secondary (text link or outline).
2. **Mobile sticky bar** from the first scroll on Home, Gallery, Detail and Contact, at 56–64 px height with a safe-area inset. On cake detail it shows the cake ref and "à partir de". Sticky purchase bars are widely reported to raise mobile add-to-cart (industry A/B write-ups cite about +8–18 %; vendor data, so treat it as directional).
3. **Gallery → inquiry in two intents:** "Je veux celui-ci" (exact cake) and "Je veux un gâteau dans ce style" (inspiration → brief sheet with the photo attached as reference).
4. **Thumb zone:** primary actions in the bottom third; never only top-right. In RTL, mirror placements.
5. **Exit points** at the end of each long page: a full-width "Votre gâteau, votre histoire — parlons-en" band with WhatsApp and call.

---

## 4. Information architecture and page-by-page recommendations

### 4.1 Proposed sitemap

```
/                     Accueil
/creations            Galerie (filtrable par occasion)        ← rename from /galerie? keep slug for SEO, change label
/creations/[slug]     Fiche gâteau (ref, photos, parts, à partir de, CTA)
/mariage              Landing Mariage & Fiançailles (collection + consultation)   ← NEW, highest-value
/tiramisu             Configurateur box tiramisu
/commander            Comment commander: délais, prix indicatifs, retrait/livraison, paiement, FAQ  ← NEW
/atelier              Notre histoire / l'atelier (about)       ← NEW short page
/contact              QR landing (exists, static, fast)
```
Primary nav (4 items plus CTA): **Créations · Mariage · Tiramisu · Commander** + `[WhatsApp]`. Language switcher as `FR | ع | EN`, always visible (not in a dropdown) on mobile.

### 4.2 Homepage: proposed order

| # | Section | Purpose | Notes |
|---|---|---|---|
| 1 | **Hero**: one full-bleed signature photo (A-list), positioning line, eyebrow "Pâtisserie sur mesure · Sidi Bel Abbès · depuis 2018", CTA "Commander sur WhatsApp" + link "Voir les créations" | Instant clarity: what, where, how to order | Replace the orbit/constellation. LCP should be the photo, preloaded, AVIF. A static image is also far lighter than framer-motion plus 6 cycling satellites. |
| 2 | **Occasions rail**: Anniversaire · Enfants · Mariage & Fiançailles · Diplôme · Quotidien · Cupcakes & Pops · Desserts | Self-segmentation | Horizontal scroll-snap on mobile with arch-masked tiles. |
| 3 | **Saison** slot (admin-editable): e.g. "Ramadan : boxes tiramisu à partager" | Timeliness, urgency with real dates | Hidden when empty. |
| 4 | **Signature creations**: 6 named cakes with ref, parts and "à partir de" | Desire plus price anchor | Editorial 2-column on mobile, not 1-column square cards. |
| 5 | **Composez votre box tiramisu**: poster or video of the 3D preview | Engagement driver | The site's unique asset; feature it. |
| 6 | **Comment ça marche**: 3 steps with *real* facts (choose → WhatsApp brief → pickup/delivery, cash) + lead-time line | Remove uncertainty | Replace the 4 generic steps. |
| 7 | **L'atelier**: founder/hands photo, 2 short sentences, "Depuis 2018" | Human trust | Replace generic "Ingrédients Premium / Sur Mesure / Fait avec Amour" cards. |
| 8 | **Instagram**: static 6-tile grid + follower count + "Suivre @gateaux_patience" | Living proof | No embed script. |
| 9 | **Final CTA band** + footer (address, hours, zones, payment) | Close | |

### 4.3 Current homepage: section-by-section critique

| Current section | What works | Problems | Action |
|---|---|---|---|
| `HeroSection` (928 lines, constellation orbit, cycling satellites, gold sweep, blobs, dots) | Technically ambitious, brand logo central | The logo, not a cake, is the focal point. The first viewport doesn't show one great cake large. Heavy client JS (framer-motion, intervals, scroll transforms) on mid-range Android. Visual noise (blur blobs + dot pattern + gold sweep + badge pulse). The real CTA is below a square orbit, often below the fold on mobile. | Replace with a single-photo editorial hero (or a 3-image slow crossfade max). Keep the logo in the header. |
| `FeaturedCakes` | Always-visible WhatsApp button per card ✔. Prefilled message with title ✔. Card links to detail ✔. | "Devis sur demande" on every card feels evasive. No ref code. Category badge over the photo adds clutter. 1-column squares on mobile mean long scrolling. `aspect-square` crops 3:4 originals. | 4:5 crops, 2-column on mobile, name + ref + "à partir de", badge removed (the section title already scopes it). |
| `CategoriesSection` | Links to filtered gallery ✔. Admin-managed ✔. | Random rainbow fallback gradients look off-brand. Dark bottom gradient on every tile is template-like. Duplicates the gallery's role. | Arch-masked occasion tiles on ivory, label under the image. Horizontal rail on mobile. |
| `AboutSection` | Year badge, image collage | Generic claims ("Ingrédients Premium", "Fait avec Amour") that every bakery makes. No person, no place. | Founder/hands photo + 2 specific sentences (what she's known for, e.g. sugar flowers, themed kids' cakes) + "Depuis 2018". |
| `HowToOrderSection` | Simple ✔, WhatsApp CTA ✔ | No lead time, price, payment or delivery facts. Rainbow icon colours off-brand. CTA opens a blank chat. | 3 steps with facts + link to `/commander`. |
| `SocialCTASection` | Gathers channels; shows the phone | Facebook listed first (Instagram is the main channel). Dark charcoal block breaks the palette. Generic "Rejoignez notre communauté". Gallery tiles darkened by overlay. | Instagram-first, follower count, static latest posts, WhatsApp as primary. |
| Unused `StatsBar` | — | Emoji icons, "+100" unverified, "100 % artisanal" is a non-claim | Delete, or keep only "Depuis 2018 · Sidi Bel Abbès". |
| `page.tsx` | Parallel data fetching ✔ | `force-dynamic` + `noStore()` means every visit is server-rendered and hits the DB. Bad for TTFB on Algerian mobile. | Use ISR/`revalidateTag` triggered by admin saves. |

### 4.4 Gallery / category (`/galerie`)

- **Keep:** category filter chips, URL `?category=` deep-linking, result count.
- **Change:**
  - Filter chips sticky under the header, horizontally scrollable, with the active chip scrolled into view.
  - 2-column masonry or uniform 4:5 grid on mobile.
  - Each tile: image, name, ref, "à partir de".
  - **Long-press or tap "♡" to shortlist.** A shortlist tray at the bottom can "Envoyer ma sélection sur WhatsApp" (sends 1–3 refs). Customers usually compare 2–3 options with family before ordering; this matches real behaviour.
  - Infinite scroll is fine for 65 cakes, but use `loading="lazy"` plus blur placeholders.
  - SEO: occasion pages with an intro paragraph in each language (e.g. *"Gâteaux d'anniversaire personnalisés à Sidi Bel Abbès"*).

### 4.5 Cake detail (`/galerie/[slug]`)

Current: zoomable images ✔, thumbnails ✔ (Baymard: thumbnails beat dots on mobile, and only 24 % of mobile sites use them, so this is good), dimensions/parts/persons ✔, WhatsApp + Call ✔, "contact us for pricing" note.

Add:
1. Name + **ref** + occasion breadcrumb
2. **"À partir de X DA"**, or a price band per guest
3. **Lead-time line** ("Commandez 3 jours à l'avance")
4. **Customisation chips**: "Personnalisable : couleurs · prénom · saveur · taille"
5. Flavours available (shared list)
6. Sticky mobile bar with ref + "Commander ce gâteau" + "Préparer ma demande"
7. "Dans le même style" carousel (exists as "Créations similaires" ✔)
8. "Photographié lors d'un vrai événement" caption where true

Also remove the `isRTL && "flex-row-reverse"` pattern (see §6.1).

### 4.6 Tiramisu configurator (`/tiramisu`)

- It already has live DA pricing, a bucket and a running total, which is excellent.
- **Entry:** show the 3D or 2D preview poster with "à partir de X DA" before the user starts.
- **Progress:** a visible step indicator (1 Format · 2 Garnitures · 3 Lettres · 4 Récap).
- **End:** a summary card image (2D render) → "Envoyer sur WhatsApp" (text plus shared image via Web Share API where supported; fallback: text plus link to a saved configuration URL) and "Partager" for Instagram Stories.
- **Performance:** lazy-load the 3D (R3F) only on intent ("Voir en 3D"), and default to the 2D preview on low-memory devices (`navigator.deviceMemory` ≤ 4) or slow connections (`navigator.connection.effectiveType`). The 3D bundle must never block the order path.

### 4.7 Order / contact

- **`/commander`** (new): delays, indicative prices, flavours, pickup/delivery zones, payment, deposit, allergens, FAQ (with `FAQPage` JSON-LD), brief form, WhatsApp. It answers every question the owner currently repeats in chat.
- **Form → admin:** keep name and phone mandatory and everything else optional. Add date, guests and occasion as optional fields mapped to admin columns. Show the response promise and a WhatsApp fallback.
- **`/contact`** (static QR page): keep it ultra-light. Add hours and "Commander sur WhatsApp" as the first button.

---

## 5. Making about 65 amateur cake photos look premium

### 5.1 What we're working with

- 172 files in `public/images/Cake*/`, named `FB_IMG_*.jpg`, **718×960 px progressive JPEG**, about 40 MB total. They were **saved from Facebook**, so they are already recompressed and size-capped. That caps quality: full-bleed desktop heroes from these will look soft.
- `next.config.mjs` doesn't set `images.formats`, so `next/image` serves **WebP, not AVIF**.

### 5.2 Treatment pipeline (no reshoot)

| Step | What | Why / caution |
|---|---|---|
| 1. Curate | Rank every photo A (hero-worthy), B (gallery), C (archive). Expect about 10–15 A. | Showing fewer, better photos beats showing all of them. |
| 2. Crop | A single **4:5** ratio for cards (1:1 only for the IG grid), cake centred, consistent headroom (about 12 % above the top tier) | Consistency is the cheapest premium signal (Pophams' "consistent photography style"). |
| 3. Clean, don't cut out | Remove clutter (cables, other plates, hands, busy wall) with generative fill or inpainting, and extend backgrounds to fit the crop | **Full background removal on 718 px Facebook JPEGs leaves halos** around piping and sugar work and looks fake. |
| 4. Grade | One preset for all: neutral-warm white balance (kill the orange/green indoor cast), +5 to +10 exposure lift, gently lowered background saturation, protected skin/cream tones, light clarity on texture | Uniform colour equals brand. |
| 5. Upscale (selectively) | Only A-list images, at most 1.5–2× with a conservative model, then inspect at 100 % | Aggressive AI upscaling "hallucinates" lettering and lace. Check names written on cakes. |
| 6. Export | Master as high-quality WebP/AVIF. Let `next/image` resize. Enable `images: { formats: ['image/avif','image/webp'] }` | AVIF is typically about 20–30 % smaller than WebP at equal quality. Matters on prepaid mobile data. |
| 7. Placeholders | Generate a tiny blur (LQIP) or dominant-colour placeholder per image at upload time, stored in the DB (`blurDataURL`) | No grey boxes; perceived speed. |
| 8. Art-directed layouts | Mix one large plate with two small details (editorial spreads); frame with arch masks (Direction B) or hairline frames (A) | Layout can carry images that aren't individually perfect. |
| 9. Naming and alt text | `GP-042-jardin-de-lina-1.avif`; localised alt text describing the design | SEO plus accessibility. |

### 5.3 Shot list and rules for the owner (phone is enough)

**Rules:**
1. Daylight next to a window, no flash, ceiling lights **off** (mixed light causes the colour casts).
2. A plain backdrop: a white or ivory foam board plus one linen cloth. Keep the same setup every time.
3. Phone at cake height (eye level) and at 30–45°; 2× lens rather than wide-angle (wide distorts tiers).
4. Wipe the board; remove everything else from the frame.
5. **Send originals**: Google Drive, or WhatsApp "Document" mode (normal WhatsApp/Facebook recompresses). This one habit improves quality more than any editing.

**Per cake (5 shots, about 3 minutes):**
| # | Shot | Use |
|---|---|---|
| 1 | Hero, eye level, centred, whole cake | Card / detail hero |
| 2 | 3/4 angle at 45° | Detail gallery |
| 3 | Macro detail (flowers, piping, lettering) | Detail / social |
| 4 | Slice or interior (for flavours) | Proves taste, not just looks |
| 5 | In context (on the event table, with hands, in the box) | "Real event" proof |

**Brand library (one-off session):** hands piping; sugar flowers in progress; flour and ingredients; packed boxes; the atelier; a founder portrait or hands-only shot; 5–8 s vertical clips for Reels and a hero video poster.

---

## 6. Algeria / MENA specifics

### 6.1 RTL quality

**Likely double-mirroring bug.** `layout.tsx` sets `dir="rtl"` on `<html>` for Arabic. Many components *also* apply `isRTL && "flex-row-reverse"` and `items-end`/`text-right` manually:
- With `dir="rtl"`, a flex row already runs right-to-left. Adding `flex-row-reverse` flips it **back** to left-to-right order.
- In a flex **column** under RTL, `items-end` aligns to the inline *end*, which is the **left**. Badges and headings can therefore end up left-aligned while paragraphs are `text-right`.

**Verify in a browser on `/ar`.** The fix is to rely on `dir` plus logical utilities (`ms-*`, `me-*`, `ps-*`, `text-start`, `start-0`, `rtl:` variants) and drop manual reversal.

**Other RTL rules:**
- Mirror directional icons (arrows, chevrons, progress, carousels); don't mirror logos, the WhatsApp or phone icons, or media "play".
- Numerals: decide between Western Arabic (0–9, common in Algeria and in DA prices) and Eastern Arabic (٠–٩). In Algeria, Western digits are the norm. Keep `formatDA` consistent per locale.
- Arabic needs **about 10–20 % larger font size** and more line-height (1.7–1.9) than Latin at the same visual weight. Never letter-space Arabic, and never apply uppercase or tracking styles to it (the current badges use `tracking-[0.28em] uppercase`).
- Mixed strings (brand name in Latin inside Arabic sentences, phone numbers) need `<bdi>` or `dir="ltr"` on phone numbers.
- Language: UI in MSA. Consider letting the WhatsApp greeting accept Darija-flavoured warmth. **Owner should validate.** French remains the default for many Algerian urban users, and the current `fr` default is right.

### 6.2 Mobile data and devices

- Audience: mostly mid-range **Android**. Algerian median mobile download was about 23 Mbps in Jan 2025 (DataReportal/Ookla), with reports of about 54–78 Mbps through 2025–2026 after 5G rollout in big cities. Users are often on **prepaid data**, and coverage varies outside city centres.
- **Budgets** (suggested):
  - Homepage under 1 MB transferred on first view, LCP under 2.5 s on a "Fast 3G / mid Android" Lighthouse profile.
  - JS for home under 150 KB gzipped.
  - 3D only on demand.
  - Fonts: at most 2 families per locale.
- Static or ISR pages (not `force-dynamic`); AVIF; no third-party embeds; preconnect only to what's needed.

### 6.3 Payment and fulfilment

- **COD dominates:** about 85–95 % of Algerian e-commerce orders are cash-on-delivery (AlgeriaTech News / Easysell 2026). Don't build online payment.
- Do state: "Paiement à la livraison / au retrait", "Acompte (en espèces ou BaridiMob/CCP) pour mariages et grosses commandes" (**owner to confirm methods**). Deposits reduce no-shows for big orders.
- Delivery: own delivery within Sidi Bel Abbès is likely. Courier networks (Yalidine and others) are poorly suited to fragile tiered cakes, so focus on pickup and local delivery zones.

### 6.4 Seasonal campaign calendar (Algeria)

| Moment | Approx. 2026–27 dates | Campaign idea | Lead-in |
|---|---|---|---|
| New Year / fêtes | 31 Dec | Bûches, party cakes | Early Dec |
| **Yennayer** (Amazigh New Year, national holiday) | 12 Jan | Heritage-themed cake or box | Late Dec |
| Valentine's | 14 Feb (overlaps Ramadan in 2027) | Heart cakes and tiramisu duos, low-key | — |
| **Ramadan** | about 8 Feb – 9 Mar 2027 (moon-dependent) | Family-size tiramisu and dessert boxes for after-iftar, soirée gatherings, gift boxes | Announce about 2 weeks before |
| **Eid al-Fitr** | about 9–10 Mar 2027 | Eid cakes and dessert assortments for visits; pre-order cut-off date | Last 10 days of Ramadan |
| Mother's Day | late May (**unverified for Algeria**) | Floral cakes | 2 weeks |
| **Eid al-Adha** | about 16–17 May 2027 | Family dessert boxes | 2 weeks |
| **BEM results** | June (2026: mid-June) | "Félicitations" graduation cakes, same-week availability | Days before results |
| **Bac results** | mid-July (2026: 12 July) | Graduation cakes peak: prepare a "Bac" collection, fast slots | 1 week before |
| **Wedding / engagement season** | roughly June–September, plus post-Eid | Wedding landing page, consultation slots, "réservez votre date" | Push from March–April |
| Mawlid | about mid-Aug 2027 (moon-dependent, **unverified**) | Traditional sweets tie-in if offered | — |
| Rentrée | September | Kids' lunch-box treats / birthday restart | Late Aug |

**Mechanics:** an admin-editable "Saison" block (title, image, CTA, dates shown and hidden automatically), a matching Instagram highlight, a **real** order cut-off date (urgency based on fact), and a WhatsApp broadcast to past clients who opted in.

---

## 7. Prioritised recommendations

**P0 — highest impact, low effort (do first)**
1. **Mobile sticky action bar** (WhatsApp + Call) on all public pages; header "Commander" visible on mobile.
2. **Context on every WhatsApp link** (page, cake ref, locale greeting). No blank chats.
3. **Cake reference codes** on cards, detail pages and messages.
4. **Lead-time line** and **"à partir de" prices or per-guest bands**, after getting real numbers from the owner.
5. **Fix RTL double-mirroring** (`dir` plus logical properties; remove `flex-row-reverse` / `items-end` hacks). Remove uppercase and tracking on Arabic.
6. **Homepage caching:** drop `force-dynamic`/`noStore`, revalidate on admin save. Enable AVIF.

**P1 — the revamp proper**
7. New art direction (A + B accents). Fonts Cormorant Garamond / Amiri / IBM Plex Sans Arabic. Remove gradients, blobs, dot patterns and emoji icons.
8. Replace the constellation hero with a single-photo editorial hero.
9. New IA: **Mariage** landing, **Commander** page (FAQ, payment, zones, delays), **Atelier** page.
10. Photo pipeline: curate an A-list, 4:5 crops, one grade, inpaint clutter, blur placeholders.
11. "Préparer ma demande" brief sheet → structured WhatsApp message and admin record.
12. Promote the tiramisu configurator on the homepage, and lazy-load 3D only on intent.

**P2 — growth**
13. Shortlist ("♡") → send selection to WhatsApp.
14. Named signature collection (wedding first).
15. Static Instagram grid plus follower count; Google Business Profile reviews link.
16. Post-delivery testimonial and photo routine with stored consent.
17. Seasonal "Saison" block plus the campaign calendar.
18. Configurator share image (Web Share API) for WhatsApp and Instagram Stories.
19. Cake mini-configurator (occasion → guests → tiers → flavour → colours → brief).

**Questions for the owner (blockers for P0/P1):**
- Minimum lead times (standard, kids' themed, wedding)
- Starting prices or per-guest price bands
- Flavours list
- Delivery zones and fees, and pickup address/hours
- Deposit policy and accepted methods
- Allergens
- Comfort with a founder photo (face or hands-only)
- Instagram follower count
- Willingness to send original photos

---

## 8. Sources

**Benchmarks**
- Pierre Hermé: https://www.pierreherme.com/
- Ladurée: https://laduree.com/
- Dominique Ansel Workshop: https://www.dominiqueanselworkshop.com/
- Cédric Grolet: https://cedric-grolet.com/
- Peggy Porschen wedding cakes: https://peggyporschen.com/pages/wedding-cakes
- Lily Vanilli: https://www.lilyvanilli.com/
- Magnolia Bakery: https://www.magnoliabakery.com/
- Krishaweb, "15 Best Bakery Website Designs for Inspiration in 2026": https://www.krishaweb.com/blog/best-bakery-website-designs/
- Zarla, "20 Stunning Bakery Website Examples": https://www.zarla.com/guides/bakery-website-examples
- MyCodelessWebsite, bakery website design guide: https://mycodelesswebsite.com/bakery-website-design/
- Awwwards Food & Drink: https://www.awwwards.com/websites/food-drink/
- Awwwards inspiration, "The Bakery": https://www.awwwards.com/inspiration/thumbnail-submission-645ca7f802d64907575597
- Bachour (Michelin Guide): https://guide.michelin.com/ca/fr/florida/miami/restaurant/bachour

**UX and conversion**
- Baymard, thumbnails in mobile image galleries: https://baymard.com/guidelines/2884-thumbnails-in-image-galleries-on-mobile
- Baymard, always use thumbnails: https://baymard.com/blog/always-use-thumbnails-additional-images
- CleanCommit, mobile sticky add-to-cart A/B test: https://cleancommit.io/ab-tests/mobile-bottom-sticky-add-to-cart-button/
- Sticky add-to-cart statistics (vendor): https://easyappsecom.com/guides/shopify-sticky-cart-conversion-data
- Custom cake order checklist / enquiry practice: https://sagnikbhattacharya.com/blog/custom-cake-orders-ai-enquiry-assistant
- Custom cake lead-time example: https://www.rashmisbakery.com/help/custom-cakes/how-much-notice-do-you-need-for-a-custom-cake
- How to order example: https://www.cravedcreations.com/how-to-order
- web.dev, embed best practices: https://web.dev/embed-best-practices
- Smash Balloon, social feeds and Core Web Vitals: https://smashballoon.com/social-feed-core-web-vitals/
- Franke, Schreier & Kaiser (2010), "The 'I Designed It Myself' Effect in Mass Customization", *Management Science*: https://doi.org/10.1287/mnsc.1090.1077
- Norton, Mochon & Ariely (2012), "The IKEA effect", *Journal of Consumer Psychology*: https://doi.org/10.1016/j.jcps.2011.08.002

**RTL and typography**
- Material Design, bidirectionality: https://m2.material.io/go/design-bidirectionality
- Microsoft Globalization, mirroring: https://learn.microsoft.com/en-us/globalization/input/mirroring
- SimpleLocalize, RTL design guide: https://simplelocalize.io/blog/posts/rtl-design-guide-developers/
- Readex Pro (Material blog): https://material.io/blog/readex-pro-legibility-arabic-type-design
- El Messiri: https://fonts.google.com/specimen/El+Messiri/about
- Reem Kufi: https://fonts.google.com/specimen/Reem+Kufi/about
- Amiri: https://fonts.google.com/specimen/Amiri/about
- Alexandria (Fontsource): https://fontsource.org/fonts/alexandria/about

**Algeria market**
- Statista, WhatsApp users in Algeria: https://www.statista.com/statistics/1146263/whatsapp-users-in-algeria/
- Sensor Tower, DZ communication apps Q4 2025: https://sensortower.com/blog/2025-q4-unified-top-5-communication-apps-units-dz-6070aae1241bc16eb81f5bab
- wmtips, messaging apps in Algeria: https://www.wmtips.com/technologies/instant-messaging/country/dz/
- DataReportal, Digital 2025 Algeria: https://datareportal.com/reports/digital-2025-algeria
- Algérie Eco, 5G and mobile network: https://algerie-eco.com/2026/04/24/internet-le-deploiement-de-la-5g-a-ameliore-le-reseau-mobile-en-algerie/
- Tech Africa, Ookla 2025 Africa rankings: https://tech.africa/ookla-speedtest-africa-2025/
- AlgeriaTech News, COD as a structural problem: https://algeriatech.news/algeria-sme-cod-to-digital-payment-conversion-2026/
- AlgeriaTech News, social commerce: https://algeriatech.news/algeria-social-commerce-instagram-tiktok-dinar-monetization-2026/
- DZBuild, e-commerce platforms in Algeria 2026: https://dzbuild.com/blog/best-ecommerce-platform-algeria-2026
- Office Holidays, Eid al-Fitr Algeria: https://www.officeholidays.com/holidays/algeria/eid-al-fitr
- Wego, Ramadan 2027: https://blog.wego.com/ramadan-2027/
- TrueCalendar, Algeria 2027 public holidays: https://truecalendar.com/public-holidays/algeria/2027
- Algérie Eco, Bac 2026 results date: https://algerie-eco.com/?p=304127
- Dzair Tube, BEM 2026: https://www.dzair-tube.dz/en/algerias-middle-school-certificate-exam-records-65-19-pass-rate-in-2026/

**Repository files reviewed:** `src/app/[locale]/page.tsx`, `src/app/[locale]/layout.tsx`, `src/components/home/*.tsx`, `src/components/layout/Header.tsx`, `src/components/gallery/CakeDetailClient.tsx`, `src/components/gallery/GalleryClient.tsx`, `src/components/tiramisu/TiramisuWizard.tsx` (grep only), `messages/fr.json`, `tailwind.config.ts`, `next.config.mjs`, `public/images/*`.

---

## 9. Confidence / unverified

| Claim | Confidence | Note |
|---|---|---|
| Mobile "Commander" hidden behind hamburger | **High** | `Header.tsx` uses `hidden md:flex` for the desktop CTA group; the mobile menu contains it. |
| Blank WhatsApp links in Header / HowToOrder / SocialCTA | **High** | Code uses bare `wa.me/<number>` there. |
| RTL double-mirroring | **Medium-high** | Follows from CSS semantics (`dir="rtl"` + `flex-row-reverse`; `items-end` in RTL columns). **Verify visually on `/ar`**; some places may have been tuned by eye already. |
| Images are 718×960 Facebook recompressions | **High** for the sampled files | Checked 3 files with `file`; all `FB_IMG_*` names suggest the same origin. |
| AVIF not enabled | **High** | No `images.formats` in `next.config.mjs`. |
| All four font families preload on every locale | **Medium** | Declared in the locale layout; exact preload behaviour depends on how the CSS variables are applied. |
| Benchmark site descriptions | **Medium** | Fetched as text (WebFetch). Visual judgements on typography and photography partly rely on prior knowledge of these brands, not fresh screenshots. Sites change often. |
| Sticky CTA uplift numbers (+8–18 %) | **Low-medium** | Vendor/agency data, not peer-reviewed; directional only. |
| WhatsApp about 27 M weekly users, about 50 % messaging share in Algeria | **Medium** | Sensor Tower / wmtips summaries; methodologies differ. |
| COD 85–95 % in Algeria | **Medium** | Industry blogs (AlgeriaTech News, Easysell), not official statistics, though consistent with general knowledge. |
| Mobile speed figures | **Medium** | Ookla/DataReportal snapshots; regional variance (Sidi Bel Abbès vs Algiers/Oran) is unknown. |
| Islamic holiday dates 2027 | **Medium** | Astronomical predictions; Algeria confirms by moon sighting. |
| Algerian Mother's Day date, Mawlid 2027 date | **Low** | Not verified. Check before planning. |
| Wedding season June–September | **Medium** | Common knowledge in the Maghreb, not sourced. The owner's own order history is the real source. |
| Arabic tagline «الصبر حلو» and Darija tone | **Low** | Copy suggestion; needs native-speaker and owner validation. |
| Prices, lead times, delivery zones, deposit methods | **Unknown** | Placeholders only. Must come from the owner. Never publish invented figures. |
| AVIF about 20–30 % smaller than WebP | **Medium** | Typical figure from general knowledge; varies per image. |
