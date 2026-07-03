# Tiramisu base photos — drop-in guide

The live preview composites the customer's letters onto a **real top-down photo of
each empty box**. Put those photos here, one per product template.

## Where each file goes

```
public/images/tiramisu/templates/
  square-small/base.png
  square-medium/base.png
  square-large/base.png
  heart-medium/base.png
  heart-large/base.png
  oval-large/base.png
```

Filename is always **`base.png`**, inside the folder named after the template id.
Minimum to start: **3** (one square, one heart, one oval); full set is **6**.

## How to shoot each photo

- **Angle:** true **90° top-down** (camera flat/parallel to the table, dead overhead).
  No tilt — perspective makes the flat letters sit wrong.
- **Empty box:** **no letters, no pearls, no decorations.** Letters are added by the app.
- **Real box rim included:** keep the actual box wall/edge in frame — that's what makes
  it read as a boxed tiramisu. (This is the *real* product edge, NOT a fake border overlay.)
- **Cocoa:** evenly dusted, natural texture (not perfectly smooth, not clumpy).
- **Lighting:** soft, even, **single dominant light from the top-left**, so it matches the
  letters (which are lit from the top) and the preview's shadow direction. No hard glare.
- **Background:** the **same** plain matte surface for all photos (light stone / off-white).
  It will be removed, so it only needs to be clean and evenly lit.
- **Framing:** box centered, **square** frame, ~8–12% margin all around, identical for all 6.
- **Consistency:** shoot all in **one session** without moving the rig/lights; lock exposure
  and white balance so colors don't drift between shots.

## Format & resolution

- **Square** image (width = height).
- **Transparent PNG** cut-out preferred: box + its own soft contact shadow, background removed.
  (A clean solid-background photo also works; the developer will cut it out.)
- **At least 900×900**; **prefer ~1600×1600 or larger** master.

## Naming convention

`base.png` inside `templates/<shape>-<size>/`, e.g. `templates/heart-medium/base.png`.
Lowercase, hyphenated. Don't rename the folders.

## Validate before/after adding

From the project root:

```
node scripts/check-tiramisu-assets.mjs
```

It reports which of the 6 are present, their dimensions/alpha, whether each is square and
big enough, and which templates still fall back to the placeholder surface. It never fails
the build — it only reports.

## Not in scope (do not add)

Pearls · transparent/lilac plastic border overlay · image export · AI-generated imagery.
