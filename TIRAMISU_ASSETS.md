# Tiramisu Customizer — Asset Brief (AI / GPT image 2 workflow)

**Standard: photoreal.** The preview composites real-looking photographic layers; it never
draws fake text. You generate the raw images below with GPT image 2 and drop them in the
exact folders. I cut, segment, colour/light-match and composite them into the live preview.

> Real photos can replace any of these later with **zero code change** — same filenames.

```
public/images/tiramisu/
├─ base/        cocoa.jpg   cream.jpg
├─ letters-raw/ ABCDEFG.png HIJKLMN.png OPQRSTU.png VWXYZ.png 01234.png 56789.png
├─ letters/     (I generate — transparent cut-out glyphs)
└─ hero/        hero-1.jpg  hero-2.jpg  hero-3.jpg
```

General settings in GPT image 2: **square 1:1, highest resolution (2048px)**, photorealistic.

---

## ASSET 1 — Base surfaces (2 images)  ★ required

### `base/cocoa.jpg`  — the cocoa top (main surface for BOTH styles)
```
Top-down 90° overhead professional food photograph of one round tiramisu filling a square
frame, perfectly centered. The whole surface is evenly dusted with cocoa powder — warm
reddish-brown, natural fine powder texture with subtle lighter and darker patches. A thin
dark collar ring around the edge. ABSOLUTELY NO text, NO letters, NO numbers, NO decoration
— a completely blank cocoa surface. Soft even daylight, gentle natural shadows, premium
patisserie look, plain dark background at the corners. Photorealistic, ultra detailed, 1:1.
```

### `base/cream.jpg`  — the mascarpone cream surface (fills the written letters)
```
Top-down 90° overhead photograph of the smooth creamy mascarpone top of a tiramisu, filling
a square frame. Soft off-white / pale cream colour, gently glossy, subtle natural surface
texture and tiny irregularities, no cocoa, no toppings, NO text or letters. Even soft
daylight, very gentle shadows. Photorealistic close-up food texture, 1:1, 2048px.
```

---

## ASSET 2 — White-chocolate letters (6 strips)  ★ required for that style

Generate **6 separate images**, each a single horizontal row of glossy white-chocolate
letters on a **pure matte black background**. Keep them legible, evenly spaced, not touching.
Name each file with its exact characters (this is how I map them).

Reusable prompt — swap the characters per row:
```
Top-down 90° overhead studio product photograph on a PURE MATTE BLACK seamless background.
A single horizontal row of individual molded white-chocolate letters spelling, left to right
with clear even gaps: «A B C D E F G». Each letter is a separate glossy creamy-white
chocolate piece, smooth with soft realistic highlights and a faint drop shadow, all the same
height, upright, clearly legible bold block letterforms, none touching. Nothing else in the
frame, no labels, no extra objects, pure black background. Photorealistic, sharp focus, 1:1.
```

Make these 6 files (replace the «…» characters each time):

| File | Characters |
|------|-----------|
| `letters-raw/ABCDEFG.png` | A B C D E F G |
| `letters-raw/HIJKLMN.png` | H I J K L M N |
| `letters-raw/OPQRSTU.png` | O P Q R S T U |
| `letters-raw/VWXYZ.png`   | V W X Y Z |
| `letters-raw/01234.png`   | 0 1 2 3 4 |
| `letters-raw/56789.png`   | 5 6 7 8 9 |

For digits use the same prompt but say "molded white-chocolate **numbers**".

**Quality check:** if any letter comes out garbled, merged, or wrong, just regenerate that
one strip. Legibility + correct order matter; exact spacing does not (I detect each piece).

---

## ASSET 3 — Atmosphere / hero (2–3 images)  ☆ recommended

```
Moody 45° photograph of an artisan tiramisu generously dusted with cocoa, one creamy layered
slice pulled forward revealing mascarpone and coffee-soaked layers, warm golden side light,
dark elegant background with soft bokeh, scattered cocoa and coffee beans, luxurious
dessert-menu mood, shallow depth of field, photorealistic, high detail.
```
Save as `hero/hero-1.jpg`, `hero-2.jpg`, `hero-3.jpg` (vary the angle/crop).

---

### Naming rules
- Exact lowercase names for base/hero; the 6 letter files named by their characters.
- Square images, don't pre-crop to a circle — I crop in code.

### After you deliver
I segment each chocolate glyph to a transparent piece (with its gloss + shadow), build the
real-time engine — cacao-writing via cream-reveal masking with feathered, cocoa-overloaded
edges, and chocolate-letters via shadowed glyph placement — and wire the live preview.
