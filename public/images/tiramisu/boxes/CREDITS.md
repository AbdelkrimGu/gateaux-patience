# Box thumbnails

`box-square.png`, `box-heart.png`, `box-oval.png` are **rendered in-house** by
`scripts/render-boxes.mjs` from our own cocoa-tiramisu surface (`base/cacao.png`).
They are top-down (90°), perfectly consistent, and match the customizer preview.

Why rendered and not stock photos: clean top-down tiramisu shots in square/heart/
oval shapes don't exist as a coherent free-license set — stock results were
mismatched (white/pink heart cakes, no oval) and would clash with the cocoa
preview. Rendering from the real surface keeps everything on-brand and identical
to what the customer designs.

To regenerate after changing the cocoa source: `node scripts/render-boxes.mjs`.
To use real photography instead, drop same-named top-down PNGs here — no code
changes needed.
