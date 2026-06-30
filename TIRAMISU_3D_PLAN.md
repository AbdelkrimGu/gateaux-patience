# Tiramisu 3D Preview — Master Plan

> Goal: let the customer see their **finished personalized tiramisu as a real 3D
> cake**, rotate it, tilt it, zoom it, and watch their text appear live in 3D —
> on phone first, then laptop. Photoreal, "greatness", no fakery.

This document is the full breakdown: the idea, the realism strategy, the
architecture, the phase-by-phase build, what I need **from you**, what I handle
**from my end**, the risks with honest tradeoffs, and the decisions I need before
I start.

---

## 0. The honest framing (read this first)

Real-time 3D in a browser is **not** the same as a photograph. A still photo can
be perfect because it's frozen light. A 3D model has to look right from *every*
angle the customer drags it to, in real time, on a phone GPU. That is harder.

So the strategy is not "model a cake and hope." It is **photoreal-by-construction**:
real lighting (HDRI), physically-based materials, soft contact shadows, tone
mapping + subtle post-processing, a constrained flattering camera, and — crucially —
**reusing the photographic detail we already produced** (the cocoa surface, the
cream/cocoa letters) as textures on the 3D surface rather than inventing new looks.

I'm confident we can hit "genuinely looks like a real cake you can spin." I will be
straight with you at each phase if something is not meeting that bar, and we keep
the current flawless 2D canvas preview as the guaranteed fallback.

---

## 1. What the customer experiences (the target)

1. They land on `/tiramisu`, pick **style** (cacao writing / white-chocolate pieces)
   and **size** (large/medium/small) and type their text — exactly as today.
2. The preview is now a **3D cake on a plate**, lit like a studio food shot.
3. They **drag to rotate**, **pinch/scroll to zoom**, the cake gently auto-rotates
   when idle. Constrained so it always looks good (can't flip it upside-down).
4. As they type, the text **updates live on the 3D top** — cocoa writing pressed
   into the surface, or glossy white-chocolate letters standing proud with real
   shadows.
5. Quick **preset angles** (Top · 3/4 · Side) + a **Reset** button.
6. A **"Save my design" / snapshot** that renders the exact configured cake to an
   image and attaches it to the WhatsApp order, so the baker sees precisely what
   was designed (high-value, low-cost add-on).
7. Graceful fallback to the 2D preview on old devices / no WebGL / reduced-motion.

---

## 2. Technical approach — the decision

Three honest options, with my recommendation.

| | A. 2.5D (3D body + flat top texture) | B. Full 3D (everything modelled) | **C. Hybrid (recommended)** |
|---|---|---|---|
| Cake body / plate | 3D | 3D | 3D |
| Cacao writing | flat texture on top | flat decal | **decal projected on the cocoa top, with a normal map so cocoa-bleed catches light** |
| White-choc letters | flat (painted-on) | true extruded 3D meshes | **true extruded 3D meshes, glossy, real shadows** |
| Realism | good top-down, weak at angles | best | **best where it matters, efficient where it doesn't** |
| Effort / risk | low | high | medium-high |

**Recommendation: C (Hybrid).** It's honest to the physical reality of each style —
cacao writing *is* flat (cream pressed into cocoa → a decal is correct), white-choc
pieces *do* sit proud (→ real geometry, real shadows, gloss). And it reuses our
existing layout math + photographic detail. This is the "senior master" answer:
spend polygons and shadows only where the eye needs them.

---

## 3. Tech stack additions

All 3D code is **client-only, lazy-loaded, and code-split onto the `/tiramisu`
route** so it never weighs down the rest of the site.

- `three` — the engine.
- `@react-three/fiber` — React renderer for three (fits our component model).
- `@react-three/drei` — helpers: `OrbitControls`, `Environment` (HDRI lighting),
  `ContactShadows`/`AccumulativeShadows`, `useGLTF`, `Decal`, `Bounds`, `Html`.
- `@react-three/postprocessing` + `postprocessing` — ACES tone mapping, subtle
  bloom, SSAO (crevice shadows), light depth-of-field. *(Optional, perf-gated.)*
- White-choc letters: `three` `TextGeometry` + `FontLoader` with a chosen
  `typeface.json` font (chunky letters extrude cleanly with a bevel = rounded
  chocolate edges). Fallback option: `troika-three-text`.
- `leva` — **dev-only** material/light tuning panel; stripped from production.
- `maath` — easing helpers for camera/auto-rotate (small).

Bundle note: three+fiber+drei is ~plus a few hundred KB gzipped. Mitigated by
dynamic `import()` + `next/dynamic({ ssr: false })` so it loads only when the 3D
preview mounts, and only on this page.

---

## 4. Architecture (how it slots into what exists)

The configurator already owns the single source of truth: `style`, `size`, `text`.
Nothing about that changes. We add a **sibling preview component** and a toggle.

```
TiramisuConfigurator (unchanged state: style/size/text)
   └─ <PreviewSwitch>
        ├─ TiramisuCanvas      (current 2D — kept as fallback & default-safe)
        └─ TiramisuScene3D     (NEW, dynamic import, ssr:false)
              ├─ <Canvas> (r3f)
              │    ├─ Lighting: <Environment> HDRI + 1 key light (shadow caster)
              │    ├─ <CakeModel>      cocoa top + cream sides + plate (PBR)
              │    ├─ <CacaoText>      <Decal> (style === 'cacao')
              │    ├─ <PieceText>      extruded letter meshes (style === 'pieces')
              │    ├─ <ContactShadows> soft grounding shadow
              │    ├─ <OrbitControls>  constrained + damped + idle auto-rotate
              │    └─ <Postprocessing> ACES + bloom + SSAO (perf-gated)
              ├─ ViewPresets (Top / 3·4 / Side / Reset)
              └─ SnapshotButton (renderer.domElement.toBlob → order attach)
```

Reused, not rebuilt:
- The **typographic layout math** from `TiramisuCanvas` (cap-height normalization,
  tracking, line gap, disc fitting) is extracted into a shared
  `src/lib/tiramisu-layout.ts` and consumed by both 2D and 3D so spacing/limits
  stay identical and we keep one place to reason about layout.
- The **char limits / sizes / sanitize** in `tiramisu-config.ts` — untouched.
- The cacao **composite** (cream letters on transparent) is rendered to an
  offscreen canvas and handed to the 3D **decal** as its texture.

---

## 5. The cake model — geometry & materials

### Geometry (procedural, code-built — no fragile AI model)
A tiramisu in this shop is a shallow round cake in/on a dish. We build it
procedurally so we control every dimension and it's a tiny asset:
- **Top surface**: a disc, very slightly domed (subtle), so the decal and letters
  sit on a believable surface and grazing-angle light reads as real cocoa dust.
- **Body / sides**: short cylinder with the cream/ladyfinger layer look.
- **Plate/dish**: the black-rimmed dish from your reference (simple revolve), or a
  clean ceramic plate. Grounds the cake and gives scale + nice reflections.

Why procedural over an AI-generated glTF: AI 3D food models (Meshy/Tripo/Rodin/Luma)
are inconsistent and rarely photoreal up close — high risk against your quality bar.
Procedural geometry + great PBR maps is the reliable path. (If you ever commission a
real Blender model we can swap it in behind the same component — the door stays open.)

### Materials (this is where realism lives — PBR)
- **Cocoa top**: matte, powdery. High roughness, subtle **normal map** for the dust
  grain, slight roughness variation. Albedo from a real **top-down cocoa photo**.
- **Cream sides**: soft off-white, mid roughness, faint subsurface warmth.
- **White chocolate** (pieces): low-mid roughness, slight **clearcoat** gloss, a
  touch of subsurface so it reads as chocolate not plastic; warm-white albedo.
- **Plate**: glazed ceramic (low roughness, environment reflections) or matte black
  rim per the reference.
- **Lighting**: a soft studio **HDRI** for image-based reflections + one key light
  that casts the real shadow. **ACES** tone mapping. Optional **SSAO** for the
  crevice between cake and plate, subtle **bloom** on the gloss highlights.
- **Contact shadow** softly grounding the cake on the plate.

I generate the **normal/roughness/AO maps from your albedo photos** using `sharp`
(same offline pipeline as the letter prep) — so you only supply flat photos, I
derive the rest.

---

## 6. The text-in-3D pipeline (the crux)

### Cacao writing  → Decal
- Render the cream-letter composite (existing engine) to an offscreen canvas at the
  laid-out positions → use as the **albedo of a `<Decal>`** projected onto the domed
  cocoa top so it follows the surface and clips to the disc.
- Derive a light **normal map** for the decal so the raised cream + cocoa-bleed
  edges catch the key light → that hand-pressed-into-cocoa look in 3D.
- Live update: regenerate the decal texture on text change (debounced ~120ms).

### White-chocolate pieces  → real extruded geometry
- For each glyph, build an **extruded 3D letter** (`TextGeometry` + bevel for rounded
  chocolate edges) placed at the same layout positions, standing proud of the cocoa.
- Glossy white-chocolate material; each letter **casts a real soft shadow** on the
  cocoa → the depth that makes 3D worth it.
- Slight per-letter rotation/position jitter (we already do this in 2D) so it looks
  hand-placed, not stamped.
- Live update: rebuild/transform letter meshes on text change (debounced).

Both paths consume the **shared layout module** so a word fills the disc identically
to the 2D preview, and respects the same per-size char limits.

---

## 7. Interaction & UX

- **OrbitControls**, damped, with constraints: polar angle clamped (no under-cake),
  min/max zoom, target locked on the cake. Idle **auto-rotate** that pauses on touch.
- **Touch**: one-finger drag = rotate, pinch = zoom. Big enough hit area; no jank.
- **Preset angles**: Top, 3/4 hero (default), Side — animated camera transitions.
- **Reset view** button.
- **Loading**: suspense + the existing shimmer until the scene is ready; fade in.
- **Snapshot → order**: button renders the current view to a PNG; we attach/reference
  it in the WhatsApp order text so the baker sees the exact design (no prices, same
  WhatsApp deep-link convention).
- **Trilingual + RTL**: all labels via `next-intl`; controls mirror correctly for AR.

---

## 8. Performance budget (phone-first)

- Lazy `import()` + `next/dynamic({ ssr:false })`; nothing 3D in the initial bundle.
- **Cap device pixel ratio** (e.g. `dpr={[1, 2]}`), lower shadow-map res on mobile.
- One shadow-casting light + baked contact shadow (cheap), not many dynamic lights.
- Compressed textures (KTX2/Basis) or right-sized PNGs; mipmaps on.
- Post-processing **gated**: detect GPU tier (`detect-gpu`) → full effects on
  capable devices, trimmed (or off) on low-end, **2D fallback** on no-WebGL.
- Pause the render loop when the canvas is off-screen / tab hidden.
- Target: smooth ~60fps on a mid-range phone for the hero angle; never block typing.

---

## 9. Accessibility & fallback

- `prefers-reduced-motion` → no auto-rotate, no idle spin.
- No WebGL / GPU too weak / 3D fails to load → **automatic 2D canvas fallback**
  (it's already excellent, so we never show a broken experience).
- A visible **2D ⇄ 3D toggle** so anyone can choose; remember choice in localStorage.
- Keyboard: preset-angle buttons are real buttons; canvas not a keyboard trap.

---

## 10. Phase-by-phase build (with exit criteria)

> Each phase ends with something you can see live and approve before the next.

- **Phase 0 — Spike / de-risk (½–1 day).** Add the deps, get a procedural cylinder
  rendering in `/tiramisu` with OrbitControls, lazy-loaded, verified on your phone.
  *Exit:* it spins smoothly on mobile, bundle stays off other routes.
- **Phase 1 — Photoreal static cake (the make-or-break).** Geometry (top/sides/
  plate), PBR materials from your photos, HDRI + key light + contact shadow, tone
  mapping. No text yet. *Exit:* a still 3D cake that reads as real from the hero
  angle — your sign-off on realism here gates everything.
- **Phase 2 — Text pipeline.** Cacao decal first, then white-choc extruded letters;
  wire to live configurator state via the shared layout module. *Exit:* typing
  updates the 3D top correctly for both styles, all sizes/limits respected.
- **Phase 3 — Interaction & UX polish.** Constraints, presets, reset, idle
  auto-rotate, mobile tuning, loading/fade, RTL labels. *Exit:* feels great to
  play with on a phone.
- **Phase 4 — Performance, fallback, snapshot, integration.** GPU-tier gating, 2D
  fallback + toggle, reduced-motion, snapshot-to-WhatsApp. *Exit:* fast on mid-range
  phone, degrades gracefully, order carries the design image.
- **Phase 5 — QA.** Cross-device/browser, trilingual + RTL, edge texts (longest
  lines, numbers, accents), typecheck + `next build`, commit. *Exit:* shippable.

If realism at **Phase 1** doesn't clear your bar, we stop and reassess before
investing in the text pipeline — that's the honest checkpoint.

---

## 11. What I need from YOU (assets & decisions)

**Assets** (flat photos/textures — I derive all the technical maps myself):
1. **Top-down cocoa surface** — a clean, even, high-res top-down photo of the
   cocoa-dusted top (fills the frame, soft even light). Becomes the cocoa albedo.
   *(We may be able to reuse the existing `base/cacao.png` — I'll test it first.)*
2. **Side / layer look** — a side photo of a cut tiramisu (cream + ladyfinger
   layers) so the cake's sides look right. Optional but adds realism.
3. **The dish/plate** — a photo of the actual black-rimmed dish you serve on (top
   and slight-angle), or tell me "use a generic white ceramic plate."
4. **White-chocolate reference** — one close photo of a white-chocolate piece/letter
   so I match colour-temperature and gloss. *(Can reuse the `letters/` set as
   reference.)*
5. *(Nice-to-have)* 2–3 reference photos of a finished decorated tiramisu from
   different angles, so I match the lighting/feel.

> If shooting is hard, AI-generated **flat top-down / side textures** work for
> albedo (same as how we did the letters). I'll give you exact GPT-image prompts
> for each once you confirm the approach — the same way we did before.

**Decisions I need** (the only blockers — see §13):
- Approve **Hybrid (Option C)** as the approach.
- Approve **procedural geometry + PBR** over a commissioned/AI glTF model.
- Plate: real dish photo, or generic ceramic?
- Default landing experience: **3D by default with 2D toggle**, or 2D default with a
  "View in 3D" button? (I recommend 3D-by-default on capable devices.)

## 12. What I handle (everything else)

All code, geometry, materials and shaders, deriving normal/roughness/AO maps from
your photos, the text-in-3D pipeline, layout-math extraction/sharing, interaction,
performance gating, fallback, snapshot-to-order, trilingual/RTL wiring, QA, build,
and commits. You only supply flat photos and approvals; I build the rest.

---

## 13. Risks & honest tradeoffs

- **Realism ceiling of real-time WebGL** — won't match a frozen photo. *Mitigation:*
  HDRI + PBR + post + constrained flattering camera + reuse real photo detail; hard
  checkpoint at Phase 1; 2D fallback always available.
- **AI 3D food models are unreliable** up close. *Mitigation:* procedural geometry,
  not AI glTF.
- **Bundle size** (three stack). *Mitigation:* dynamic import, route-split, ssr:false.
- **Mobile performance**. *Mitigation:* DPR cap, shadow-res scaling, GPU-tier gating,
  pause-when-hidden, post-processing optional.
- **White-choc extruded letters vs. our raster sprites** — for 3D we switch pieces to
  real extruded geometry from a font (cleaner extrusion/bevel than vectorizing
  sprites). Cacao stays photo-based via decal. *(Noted so there's no surprise.)*
- **Scope** — this is a multi-day build, not an afternoon. Phased so you get value
  and a kill-switch at each step.

---

## 14. Immediate next step (on your "go")

Phase 0 spike: install the 3D stack, stand up a lazy-loaded spinning procedural cake
on `/tiramisu` behind a 2D/3D toggle, confirm it's smooth on your phone and isolated
to this route. Then straight into Phase 1 (the realism make-or-break) with whatever
cocoa/plate photos you've approved.

I will **not** install anything or touch the build until you approve §11's decisions —
this doc is the plan, not the action.
