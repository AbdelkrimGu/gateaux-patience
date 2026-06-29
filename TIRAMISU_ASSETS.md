# Tiramisu — image assets to generate (GPT image 2)

The live customizer renders the customer's text itself (cacao writing + white-chocolate
letters), so **the base photos must be CLEAN — no text, no letters, no numbers on them.**

Save the results into `public/images/tiramisu/` with these **exact** names:

| File | Used for | Required |
|------|----------|----------|
| `base-cacao.jpg`  | "Écriture au cacao" preview | ✅ |
| `base-pieces.jpg` | "Lettres en chocolat blanc" preview | ✅ |
| `hero.jpg`        | optional atmospheric shot | ⬜ |

**Shape:** square (1024×1024), shot **straight from above (top-down, 90°)**, the round
tiramisu centered and filling the frame. The preview crops it to a circle, so keep the
important surface in the middle. The center should be a fairly **even cacao tone** so the
overlaid text reads well.

---

## 1) `base-cacao.jpg` — clean cacao top (for written messages)

```
Top-down (90° overhead) professional food photograph of a single round tiramisu,
filling a square frame, centered. The entire surface is generously and evenly dusted
with cocoa powder — a deep, warm reddish-brown, slightly uneven and natural with a few
darker and lighter patches, fine powder texture clearly visible. The cake sits in a thin
dark acetate collar / black ring mold with a clean edge. Absolutely NO text, NO letters,
NO numbers, NO writing, NO decoration on the surface — just pure cocoa-dusted mascarpone.
Soft natural side light from the upper-left, gentle shadows, shallow appetizing depth.
Rich, premium pastry-shop look. Plain dark out-of-focus background at the corners.
Photorealistic, high detail, 1:1.
```

## 2) `base-pieces.jpg` — clean cacao top (for white-chocolate letters)

```
Top-down (90° overhead) professional food photograph of a single round tiramisu,
filling a square frame, centered. The whole top is fully and smoothly covered in an even,
rich layer of cocoa powder, dark chocolate-brown, with a soft matte finish and subtle fine
texture. A neat pale cream / white rim around the edge. Completely BLANK surface — NO text,
NO letters, NO numbers, NO chocolate pieces, NO decoration of any kind. Soft diffused
overhead studio light, faint glossy sheen suggesting a fresh creamy surface, gentle natural
shadow at the edge. Elegant, high-end patisserie aesthetic. Clean dark surface around the
cake. Photorealistic, ultra detailed, 1:1.
```

## 3) `hero.jpg` — optional atmospheric shot

```
Moody, appetizing 45° photograph of an artisan tiramisu in a round dish, generously dusted
with cocoa, one creamy layered slice pulled slightly forward to reveal the soft mascarpone
and coffee-soaked layers. Warm golden side light, dark elegant background with soft bokeh,
a dusting of cocoa and a few coffee beans scattered nearby. Luxurious dessert-menu mood,
shallow depth of field, photorealistic, high detail.
```

---

### Tips for the most realistic preview
- Even, matte cocoa in the **center** = the cleanest letters. Avoid big highlights mid-frame.
- Shoot/generate truly top-down; an angled photo makes the overlaid text look "floated".
- If you only generate one good top-down cacao top, you can reuse the same file for both
  `base-cacao.jpg` and `base-pieces.jpg` — the styling still differs in the app.
