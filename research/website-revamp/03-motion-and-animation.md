# 03 — Motion & Animation: State of the Art 2025–2026 for Gateaux Patience

> Research brief for the website revamp. Scope: libraries, signature patterns, motion principles, performance and accessibility, and code that can be pasted into this repo (Next.js 14 App Router, React 18, TypeScript, Tailwind 3.4, framer-motion 11, R3F 8). No code was changed while writing this.
> Researched: October 2026.

---

## TL;DR

1. **Stay on Motion and move it to the new package.** `framer-motion` was renamed **Motion** (`motion/react`). v12 has **no breaking changes** compared with v11 and still supports React 18. The switch is `npm i motion` plus an import change. Add `LazyMotion` and `m` to bring the animation runtime down from about 34 kB to about 4.6 kB on first load plus about 15 kB loaded lazily (`domAnimation`).
2. **Use CSS for the cheap, high-volume work.** That covers scroll-driven reveals (`animation-timeline: view()`, which runs off the main thread in Chrome 115+ and Safari 26+), `@starting-style` entry animations (Baseline 2024) and a CSS-only marquee. Firefox stable still has scroll-driven animations behind a flag, so treat them as progressive enhancement: content must already be fully visible without them.
3. **GSAP is now 100% free**, including SplitText, ScrollTrigger, Flip and MorphSVG, for commercial use (Webflow, v3.13, April/May 2025). The only restriction is that you can't use it to build a no-code animation tool that competes with Webflow. **We don't need it yet.** Add it only if we build a pinned "scrollytelling" chapter or want SplitText's polished masking. It adds about 23 kB gzip for core, more with ScrollTrigger, and it can't be tree-shaken.
4. **Lenis smooth scroll: desktop only, or skip it.** Touch devices keep native scroll by default (`syncTouch: false`), so it does little for our mostly-Android audience. It also adds its own scroll-related bugs (scroll-snap, iframes such as the Google Maps embed, fixed elements).
5. **Page transitions and gallery-to-detail shared element:** use the browser **View Transitions API** through the small `next-view-transitions` library. Next's own `experimental.viewTransition` and React `<ViewTransition>` need Next 15.2+ and React canary/19, so they are **not available on Next 14**. Same-document VT runs in Chrome 111+, Safari 18+ and Firefox 144+. Browsers without it simply navigate normally.
6. **Restraint is the luxury signal.** Use a few slow, well-eased reveals (600–900 ms, `cubic-bezier(0.16,1,0.3,1)`) for editorial moments. Keep everything the user triggers fast (120–240 ms). Animate only `transform` and `opacity`, plus `clip-path` sparingly. Respect `prefers-reduced-motion` across the whole site with `<MotionConfig reducedMotion="user">`, which **the site does not do today** (only the 3D tiramisu scene handles it).
7. **RTL:** every directional motion (slide-from-start, marquee direction, magnetic offsets, progress lines) must read its direction from `dir`. Never split **Arabic** text into characters, because that breaks letter joining. Split by words or lines only.

---

## 0. Where the repo is today (audit)

| Area | Current approach | Observation |
|---|---|---|
| Hero (`src/components/home/HeroSection.tsx`, 928 lines) | `framer-motion`: `motion.div` entry, `whileHover/whileTap`, `useScroll`/`useTransform` parallax (`orbitY`, `storyY`), `AnimatePresence mode="popLayout"` | Good taste already: `EASE = [0.16, 1, 0.3, 1]` is the right curve. It imports the full `motion` component (~34 kB). Six `CyclingImage` timers cross-fade with `transition-opacity`, which is fine. The satellite ring animates `box-shadow` on hover (`transition-[box-shadow]`). That is a paint-heavy property; replace it with an opacity-faded pseudo-element shadow. |
| Other home sections (About, Categories, FeaturedCakes, Gallery) | `react-intersection-observer` `useInView` + Tailwind class toggles (`animate-slide-up`, etc.) | Works and costs little. It could move to CSS scroll-driven reveals with an IO fallback, or to a shared `<Reveal>` so every section uses the same easing and timing. |
| Tailwind keyframes | `fade-in 0.6s ease-in-out`, `slide-up 0.6s ease-out`, `float 3s infinite`, `scale-in 0.25s cubic-bezier(0.16,1,0.3,1)` | Durations and easings don't match each other. `ease-in-out` on an entrance feels sluggish. Use the tokens in §6. |
| Reduced motion | Only `TiramisuScene3D` handles it | **Gap.** Add `MotionConfig reducedMotion="user"` and a global CSS media query. |
| Page transitions | None (hard cuts) | This is the biggest opportunity for the site to feel seamless. |

---

## 1. Library landscape (2025–2026)

### 1.1 Motion (formerly Framer Motion), `motion/react` v12
- **Status:** In late 2024 Framer Motion became the independent, MIT-licensed project "Motion". The v12 React API is the same as v11; the upgrade guide says *"There are no breaking changes in Motion for React in version 12"*. To migrate, `npm uninstall framer-motion && npm install motion` and change imports to `"motion/react"`. React 18 is the minimum since v7, so React 18 + Next 14 is fully supported.
- **Bundle (from motion.dev):** the `motion` component is ~34 kB. The `m` component is ~4.6 kB, plus `domAnimation` (~15 kB, animations, variants, exit, tap/hover/focus) or `domMax` (~25 kB, adds layout animations, `layoutId` and drag), loaded with `LazyMotion`. `useAnimate` mini is 2.3 kB and the hybrid is 17 kB.
- **Strengths for us:** declarative React API, `AnimatePresence` exits, `layout`/`layoutId` shared elements, springs, `whileInView`, and `useScroll`. `useScroll` **uses native `ScrollTimeline` when it can**, which gives hardware-accelerated scroll-linked `opacity`/`transform`/`clipPath`/`filter`. `MotionConfig reducedMotion="user"` handles reduced motion globally.
- **Weaknesses:** no built-in text splitter. We need a ~20-line one; see §7.3. `AnimatePresence` exit animations on **route changes** in the App Router are unreliable, because the router unmounts the old tree before the exit can run (the community "FrozenRouter" hack depends on Next internals). Use View Transitions for route changes instead.

### 1.2 GSAP (+ ScrollTrigger, SplitText, Flip, MorphSVG)
- **Licensing (verified):** Webflow acquired GreenSock and released **GSAP 3.13 as 100% free, including all former Club plugins** (SplitText, MorphSVG, ScrollSmoother, DrawSVG, etc.), commercial use included. `gsap-trial` is deprecated; use plain `gsap`. The license is **not open source**. Its main restriction: you can't use GSAP in *"tools that allow users to build visual animations without code … that competes with Webflow's visual animation building capabilities"*. A bakery website is clearly fine.
- **SplitText was rewritten in 3.13:** about 50% smaller, built-in screen-reader handling (`aria-label` on the parent, split pieces `aria-hidden`), a `mask: "lines" | "words" | "chars"` option for overflow-clip reveals, and `autoSplit` with `onSplit` to re-split on resize or font load.
- **React:** `@gsap/react`'s `useGSAP()` is a drop-in replacement for `useEffect` with automatic `gsap.context()` cleanup (it handles StrictMode double-invoke). It takes `scope: ref`, and `contextSafe()` covers handlers that run later. It needs `"use client"`.
- **Bundle:** core is ~23 kB gzip (Motion's comparison number, consistent with bundlephobia), and ScrollTrigger adds roughly 10–12 kB more (unverified exact figure). It does not tree-shake.
- **When to choose GSAP:** long, multi-step timelines that scrub with scroll and **pin** a section, such as "how a wedding cake is built, layer by layer". ScrollTrigger's pinning plus `scrub` is still the industry standard on Awwwards and Codrops. Also: SVG morphing (logo or "whisk" line drawings) and SplitText polish.

### 1.3 Lenis (darkroom.engineering)
- A few kB, zero dependencies. It ships `lenis/react` (`<ReactLenis root>`), `lenis/snap` and a GSAP adapter. Defaults: `lerp 0.1`, `duration 1.2`, `smoothWheel true`, **`syncTouch false`** (touch keeps native scroll), `autoRaf false`, `anchors false`.
- **Documented limitations:** no CSS scroll-snap, Safari capped at 60 fps, problems inside iframes, possible lag with `position: fixed` on old macOS Safari, and odd touch behavior on iOS < 16 with `syncTouch`.
- **Verdict:** Lenis is the "Awwwards feel" on desktop trackpads and wheels. On Android it does almost nothing, which is good for performance but means it doesn't fix mobile feel. If we add it, enable it only for `(pointer: fine)`, keep `syncTouch: false`, and import `lenis/dist/lenis.css`.

### 1.4 CSS-native (2025–2026 platform)
| Feature | Support (Oct 2026) | Use for |
|---|---|---|
| **Scroll-driven animations** (`animation-timeline: scroll()/view()`, `animation-range`) | Chrome/Edge 115+, **Safari 26+** (threaded since 26.4), **Firefox: behind flag in stable** (Interop 2026 focus area) | Reveal-on-view, progress bars, small parallax. Runs **off the main thread**, so it's ideal for low-end Android (Chrome). |
| **View Transitions, same-document** (`document.startViewTransition`, `view-transition-name`) | Chrome 111+, Safari 18+, **Firefox 144+** | Page transitions, gallery-to-detail shared element |
| **View Transitions, cross-document** (`@view-transition { navigation: auto }`) | Chrome 126+, Safari 18.2+, not Firefox | Not needed: Next is a single-page app after hydration |
| **`@starting-style` + `transition-behavior: allow-discrete`** | Baseline 2024 (Chrome 117, Safari 17.5, Firefox 129) | Entry animation for modals, popovers, toasts, and `display:none`→`block` without JS |
| `linear()` easing function | Baseline 2023/24 | Spring-like curves in pure CSS |

### 1.5 Recommended combination for this project

| Layer | Tool | Why |
|---|---|---|
| Component motion (hover, tap, presence, layout, springs, scroll-linked hero) | **Motion v12** (`motion/react`) via `LazyMotion` + `m` + `domAnimation` (`domMax` loaded only on pages with `layoutId`) | Already used; no new dependency, just a rename. |
| Section reveals, marquee, progress, modal entry | **Pure CSS** (scroll-driven with `@supports` + an IO fallback we already have; `@starting-style`) | Zero JS, runs off the main thread, best for 4G Android. |
| Route transitions + gallery-to-detail shared element | **View Transitions API** via `next-view-transitions` (MIT, by Shu Ding of Vercel) | Works on Next 14 App Router; degrades to a normal navigation. |
| Optional, phase 2 | **GSAP + ScrollTrigger + SplitText** for one signature pinned story section, loaded with `next/dynamic` on that page only | Free now; best tool for scrubbed and pinned timelines. |
| Optional, desktop polish | **Lenis**, `(pointer:fine)` only | Smooth wheel. Skip on touch. |
| Skip | Custom cursors, WebGL page-transition shaders, Barba-style full-page curtain loaders | Heavy, and they hurt INP and LCP on our audience's phones. |

---

## 2. Signature patterns: what creates "wow" and flow

Ranked by **value for a patisserie site ÷ cost on a mid-range Android**.

| # | Pattern | Value | Cost | Recommendation |
|---|---|---|---|---|
| 1 | **Shared-element gallery → detail** (the cake photo morphs from card into the hero of the detail page) | Very high: the single most "native-app" feeling | Low with View Transitions | **Do it** (§7.6) |
| 2 | **Image mask / clip-path reveals** (photo uncovers from bottom or corner while it scales from 1.15 to 1) | High: editorial, luxurious, suits food photography | Low if CSS scroll-driven / `clip-path: inset()` | **Do it** (§7.4) |
| 3 | **Split-line headline reveals** (each line rises out of a mask) | High: the signature Awwwards typography move | Low | **Do it on h1/h2 only** (§7.3) |
| 4 | **Add-to-order / CTA feedback** (button morphs to check, badge pops with a spring, WhatsApp CTA gives a subtle "nudge") | High: directly tied to conversion | Tiny | **Do it** (§7.7) |
| 5 | **Hover states on product cards** (image scale 1.04 with slow ease, overlay "Commander →" slides in, gold underline draws) | High on desktop | Tiny | **Do it**; on touch use `:active` scale 0.98 instead |
| 6 | **Page transitions** (cross-fade + 8px rise; a brief rose/cream curtain for the first load only) | Medium-high: makes navigation feel seamless | Low with VT | **Do it, subtle** (§7.6) |
| 7 | **Parallax depth** (hero layers, decorative zellige, floating macarons) | Medium | Medium; jank risk on Android | **Small amplitude (≤ 40–80 px), hero only, off for reduced motion.** Already present. |
| 8 | **Marquee** (infinite band: "Mariage · Anniversaire · Fiançailles · Tiramisu …" or client photos) | Medium: adds rhythm, fits a bakery | Tiny (CSS) | **Do it**, RTL-aware, pausable (§7.8) |
| 9 | **Sticky scroll storytelling** ("How to order" in 4 steps: image sticky, text scrolls; or a cake assembled layer by layer) | High wow, medium value | Medium (GSAP pin or CSS `position: sticky` + `useScroll`) | **Phase 2**. Start with CSS `sticky` + Motion `useScroll`. |
| 10 | **Preloader choreography** | Low: it's a delay, and LCP pays for it | High | **No blocking preloader.** At most a 600–900 ms *intro* choreography that runs **after** first paint over the already-visible hero (logo fades, then headline lines, then CTA). |
| 11 | **Magnetic buttons** | Low-medium, desktop only | Low | Optional, `(hover:hover) and (pointer:fine)` only (§7.9) |
| 12 | **Custom cursor / cursor followers** | Low | Medium; per-frame JS on pointermove | **Skip.** No cursor on touch (95%+ of our traffic), it fights the accessibility of the native cursor, and it costs main-thread time on desktop. |

**Why cursor effects are skipped on mobile:** phones have no hover or cursor. Emulating one means `pointermove` handlers and per-frame transforms, and that main-thread work competes with taps (INP). Award sites gate these effects behind `@media (hover:hover) and (pointer:fine)`.

---

## 3. Motion design principles

### 3.1 Purposeful vs decorative
- **Purposeful** motion explains a change: where an element came from (shared element), what happened (order added), what's interactive (hover, press), where you are (progress). Keep it, even under reduced motion, as a fade.
- **Decorative** motion sets mood: parallax, marquees, floating elements, split-text. Use it sparingly, never in the way of a task, and turn it **off** for reduced motion.
- **Frequency rule** (Emil Kowalski): the more often a user triggers something, the less it should animate. Raycast-style: a 500 ms animation repeated hundreds of times becomes friction. Menu open, tab switch and filter chips stay ≤ 200 ms, or have no animation at all.

### 3.2 Easing (concrete values)
- **Entrances and anything the user triggers:** ease-**out**. It starts fast, so it feels responsive. Built-in CSS `ease-out` is too weak. Emil recommends a custom **strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`** (≈ easeOutQuint).
- **Editorial or luxury reveals:** **`cubic-bezier(0.16, 1, 0.3, 1)`** (≈ easeOutExpo). Long, silky deceleration; already the repo's `EASE`.
- **On-screen movement from A to B** (element already visible, moving or morphing): ease-**in-out**, `cubic-bezier(0.65, 0, 0.35, 1)` (easeInOutCubic). For dramatic page curtains: `cubic-bezier(0.76, 0, 0.24, 1)` (easeInOutQuart).
- **Exits:** a short ease-in, `cubic-bezier(0.4, 0, 1, 1)`, about 60–70% of the entrance duration. Exits should get out of the way.
- **Avoid:** `linear` (except for marquees, progress and scroll-scrubbed animations), and `ease-in` on entrances (it feels laggy).

### 3.3 Durations
- Emil's guidance: UI animations should usually stay **under 300 ms**.
- Micro (press, toggle, color): **100–160 ms**
- Small UI (tooltip, dropdown, chip, badge): **160–240 ms**
- Medium (modal, drawer, card expand, page cross-fade): **280–400 ms**
- Editorial reveals (images, headlines, as the user scrolls to them): **600–900 ms**. Allowed because they aren't blocking a task.
- Luxury hero intro (once per session): total choreography **≤ 1.2–1.6 s**, with the CTA interactive from t = 0.
- Mobile: about 15–20% shorter than desktop, because distances are smaller.

### 3.4 Stagger & choreography
- Stagger children **40–80 ms**, and **cap the total stagger at about 400 ms** (12 cards × 80 ms = 960 ms feels slow, so cap the index or use `staggerChildren` with a ceiling).
- Order: **container → media → headline → body → CTA**. The eye follows motion, so the CTA arrives last and gets noticed.
- **Overlap** steps (start the next at about 60% of the previous) instead of chaining them back to back. That is what makes sequences feel fluid rather than mechanical.
- One focal motion per viewport. If the image is revealing, the text should just fade.

### 3.5 Springs
Springs are interruptible and keep velocity, so they suit anything the user drives (drag, toggle, badge pop, layout). Josh Comeau's framing: high stiffness = snappy; high damping = no bounce; most UI needs **little or no bounce**.
- `snappy` (buttons, toggles, badge): `{ type: "spring", stiffness: 500, damping: 30, mass: 1 }`
- `smooth` (layout, card expand, shared element): `{ type: "spring", stiffness: 260, damping: 32 }` or the newer duration-based `{ type: "spring", visualDuration: 0.45, bounce: 0.1 }`
- `playful` (the "added to order" pop, once): `{ type: "spring", stiffness: 420, damping: 14 }` (visible overshoot)
- Luxury never bounces on large surfaces. Keep bounce for small, celebratory feedback.

### 3.6 How luxury brands move
High-end patisserie, jewelry and fashion sites (the Awwwards "luxury" tag) share a pattern: **slow, long-decelerating reveals; large type rising out of masks; images uncovering with a slight scale-down (1.1→1); generous whitespace; almost no bounce; no gratuitous rotation; cross-fades instead of slides.** The motion feels *quiet*. Speed reads as cheap, slowness reads as confident, but only for content. Controls must still be instant.

---

## 4. Performance & accessibility

### 4.1 Rendering rules
- **Animate only `transform` and `opacity`.** These only trigger compositing. `clip-path` and `filter` are also accelerated in Motion's `useScroll` and in Chrome scroll-driven animations, but use them sparingly on Android.
- **Never animate:** `width/height/top/left/margin` (layout), `box-shadow` and `backdrop-filter` (paint, and very expensive on low-end GPUs), or `filter: blur()` on large images.
  - Shadow trick: put the larger shadow on an `::after` pseudo-element and animate **its opacity**.
- **`will-change`:** don't apply it globally. Add it just before an animation (`will-change: transform` on hover-able cards is fine) and remove it after one-off animations. Each promoted layer costs GPU memory, which is scarce on 2–3 GB Android phones.
- **CLS:** reveals must start from the element's final layout box (transform/opacity only). Don't insert content that pushes text down. Set image dimensions (`next/image` `fill` + sized parents).
- **LCP:** **never hide the LCP element (hero image or H1) behind `opacity: 0` waiting for JS.** If the hero headline animates in, render it visible in SSR HTML and animate from `opacity: 0.001`/translate with CSS, or use Motion `initial={false}` for the first paint. Better still, apply the intro only to secondary elements (satellites, badge, CTA).
- **INP:** keep tap handlers light. Feedback should be pure CSS `:active` scale or Motion `whileTap`, which run on the compositor. Don't run `setState` that re-renders a 900-line hero on every scroll frame; use Motion values (`useScroll`/`useTransform`), which bypass React renders.
- **Lazy-load heavy effects:** `next/dynamic(() => import(...), { ssr: false })` for GSAP sections, Lenis and R3F (already done for the tiramisu). Gate them with `IntersectionObserver` so they mount only near the viewport. Load `domMax` only on routes that use `layoutId`.
- **Low-end detection** (optional): `navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4` → disable parallax and marquee duplication and reduce stagger. Treat this as a hint only; it isn't supported everywhere.
- **Pause what isn't visible:** marquees and cycling images should pause off-screen (`animation-play-state` via IO) and when `document.hidden`.

### 4.2 `prefers-reduced-motion`
- web.dev's guidance: remove decorative motion (parallax, animated backgrounds, auto-playing loops). **Keep functional feedback**, ideally as a cross-fade or instant change (the "item flies to cart" kind of feedback becomes a fade or highlight).
- In Motion, `<MotionConfig reducedMotion="user">` disables transform and layout animations but keeps opacity and color.
- In CSS, write decorative animation **inside `@media (prefers-reduced-motion: no-preference)`** (motion as opt-in), so reduced motion is the default.
- Add a global safety net (§7.1).

### 4.3 RTL (Arabic) considerations
- Directional motion should use **logical directions**: "enter from inline-start". Compute `const dir = locale === 'ar' ? -1 : 1` and multiply x offsets by it, or read `getComputedStyle(el).direction`.
- Marquee: reverse `animation-direction` under `[dir="rtl"]`.
- **Text splitting:** split Arabic by **words or lines only**. Splitting into characters wraps each letter in its own span, which breaks cursive joining (letters render in isolated forms). It also breaks ligatures. GSAP SplitText has the same caveat for chars.
- Clip-path wipes should start from the inline-start side: `inset(0 100% 0 0)` in LTR becomes `inset(0 0 0 100%)` in RTL.
- `view-transition-name` must be unique per page. Locale doesn't matter, but make sure slugs don't collide across locales.
- Arabic lines are often taller (diacritics). Add about 0.15em of padding inside line masks, or descenders and diacritics get clipped.

---

## 5. What to build (phased)

**Phase 1 (high value, low risk)**
1. Upgrade to `motion` v12. Add `MotionProvider` (LazyMotion + MotionConfig) and `lib/motion.ts` tokens.
2. A shared `<Reveal>` and a CSS `.reveal` (scroll-driven with IO fallback) replace the ad-hoc `animate-slide-up`.
3. `<SplitLines>` on section H2s and the hero H1 (not blocking LCP).
4. Image clip-path reveal on About and FeaturedCakes images.
5. Card hover and press states; "Commander" CTA feedback.
6. Global reduced-motion safety net; replace the box-shadow hover animation.

**Phase 2**
7. `next-view-transitions`: page cross-fade plus a gallery card-to-detail shared image.
8. RTL-aware occasion marquee.
9. "How to order" sticky storytelling with CSS `sticky` + `useScroll` (or GSAP ScrollTrigger if we want pinning and scrubbing with SplitText).

**Phase 3 (desktop polish, optional)**
10. Lenis on `(pointer:fine)`; magnetic primary CTA.

---

## 6. Motion system spec (tokens)

```ts
// src/lib/motion.ts  — single source of truth for all motion
export const duration = {
  instant: 0.1,   // press, color
  fast:    0.16,  // toggles, chips, icon swaps
  base:    0.24,  // dropdowns, tooltips, badges
  medium:  0.36,  // modal, drawer, page cross-fade
  slow:    0.6,   // section reveal (mobile)
  reveal:  0.8,   // editorial image / headline reveal (desktop)
  luxe:    1.1,   // hero intro, once per session
} as const;

export const ease = {
  out:      [0.23, 1, 0.32, 1],   // default for UI (strong ease-out, Emil)
  outExpo:  [0.16, 1, 0.3, 1],    // editorial/luxury reveals (current repo EASE)
  inOut:    [0.65, 0, 0.35, 1],   // on-screen A→B moves
  inOutLux: [0.76, 0, 0.24, 1],   // curtains, page-level wipes
  in:       [0.4, 0, 1, 1],       // exits (short!)
} as const satisfies Record<string, [number, number, number, number]>;

export const spring = {
  snappy:  { type: "spring", stiffness: 500, damping: 30 },
  smooth:  { type: "spring", stiffness: 260, damping: 32 },
  playful: { type: "spring", stiffness: 420, damping: 14 },
} as const;

export const stagger = { tight: 0.04, base: 0.06, loose: 0.08, maxTotal: 0.4 } as const;
export const distance = { sm: 8, md: 16, lg: 32 } as const; // px — keep reveals subtle
export const staggerDelay = (i: number, step = stagger.base) =>
  Math.min(i * step, stagger.maxTotal);
```

```css
/* src/app/globals.css — CSS mirror of the tokens */
:root {
  --dur-instant: 100ms; --dur-fast: 160ms; --dur-base: 240ms;
  --dur-medium: 360ms;  --dur-slow: 600ms; --dur-reveal: 800ms;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-in-out-lux: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
}
```

Tailwind: extend `transitionTimingFunction` with `out: 'var(--ease-out)'` and similar, and `transitionDuration` with the same tokens, so classes like `duration-base ease-out-expo` are available.

| Use case | Duration | Easing / spring | Distance |
|---|---|---|---|
| Button press | 100 ms | `out` / `snappy` | scale 0.97 |
| Card hover image zoom | 600 ms | `outExpo` | scale 1.04 |
| Dropdown / language switcher | 200 ms | `out` | y 4px + opacity |
| Modal in / out | 320 / 200 ms | `outExpo` / `in` | scale 0.96→1 + opacity |
| Section reveal (text) | 600 ms | `outExpo` | y 16px |
| Image clip reveal | 900 ms | `outExpo` | clip inset 100%→0, scale 1.12→1 |
| Headline split-lines | 800 ms, 60 ms stagger | `outExpo` | y 105% (inside mask) |
| Page cross-fade | 300 ms | `out` | y 8px |
| Shared element morph | 450 ms | `inOut` | — |
| Badge pop | spring | `playful` | scale 0→1 |

---

## 7. Code snippets (the 8 most valuable patterns)

> All are client components and assume `motion` v12 (`npm i motion`, imports from `motion/react`). With the current `framer-motion` 11, the same code works by importing from `"framer-motion"` and `"framer-motion/m"`. Tokens come from `src/lib/motion.ts` above.

### 7.1 Provider: lazy features + global reduced motion

```tsx
// src/components/motion/MotionProvider.tsx
"use client";
import { LazyMotion, MotionConfig } from "motion/react";

const loadFeatures = () => import("./features").then((m) => m.default);
// ./features.ts:  import { domAnimation } from "motion/react"; export default domAnimation;
// (use a separate features file with domMax on routes needing layoutId/drag)

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.36, ease: [0.23, 1, 0.32, 1] }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
```
Mount it in `src/app/[locale]/layout.tsx` around `{children}`. With `strict`, any leftover full `motion.*` import throws, which helps catch it during migration. Then use `import * as m from "motion/react-m"` and `<m.div>`.

```css
/* globals.css — safety net for CSS/Tailwind animations */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 7.2 `<Reveal>`: one entrance for every section (CSS-first, zero JS on Chrome/Safari 26)

```css
/* globals.css */
.reveal { opacity: 1; } /* default: visible (no-JS, Firefox, reduced motion) */

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: reveal-up linear both;          /* linear: progress is scroll-mapped */
      animation-timeline: view();
      animation-range: entry 0% entry 60%;       /* finishes when 60% into view */
    }
  }
  /* Fallback driven by IntersectionObserver toggling [data-inview] */
  @supports not (animation-timeline: view()) {
    .reveal:not([data-inview="true"]) { opacity: 0; transform: translateY(16px); }
    .reveal { transition: opacity var(--dur-slow) var(--ease-out-expo),
                          transform var(--dur-slow) var(--ease-out-expo); }
  }
}
@keyframes reveal-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: none; }
}
```
```tsx
// src/components/motion/Reveal.tsx — tiny IO fallback (reuses react-intersection-observer)
"use client";
import { useInView } from "react-intersection-observer";
export function Reveal({ as: Tag = "div", className = "", delay = 0, ...rest }: any) {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "0px 0px -10% 0px" });
  return <Tag ref={ref} data-inview={inView} className={`reveal ${className}`}
              style={{ transitionDelay: `${delay}s` }} {...rest} />;
}
```
Note: scroll-driven reveals *scrub* (they reverse if you scroll back up). That feels very "2026". If you prefer play-once, use only the IO path.

### 7.3 Split-line headline reveal (RTL-safe, no GSAP)

```tsx
// src/components/motion/SplitLines.tsx
"use client";
import * as m from "motion/react-m";
import { ease, stagger } from "@/lib/motion";

/** Pass lines explicitly (from translations, using "\n") — deterministic,
 *  no measuring, no layout shift, works for Arabic (no char splitting). */
export function SplitLines({ text, as: Tag = "h2", className = "" }:
  { text: string; as?: any; className?: string }) {
  const lines = text.split("\n");
  return (
    <Tag className={className} aria-label={text.replace(/\n/g, " ")}>
      {lines.map((line, i) => (
        <span key={i} aria-hidden className="block overflow-hidden pb-[0.15em] -mb-[0.15em]">
          <m.span
            className="block will-change-transform"
            initial={{ y: "105%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.8, ease: ease.outExpo, delay: i * stagger.loose }}
          >
            {line}
          </m.span>
        </span>
      ))}
    </Tag>
  );
}
```
Why explicit `\n` lines instead of measuring: no resize re-splitting, no flash of unstyled text, and translators control line breaks in all three languages. If automatic line detection is needed later, GSAP SplitText (`type: "lines", mask: "lines", autoSplit: true`) is now free and handles screen readers and re-splitting on resize. Under `reducedMotion="user"`, Motion skips the `y` transform automatically.

### 7.4 Image mask reveal (clip-path + scale): the "luxury photo" move

```tsx
// src/components/motion/ImageReveal.tsx
"use client";
import Image, { ImageProps } from "next/image";
import * as m from "motion/react-m";
import { useLocale } from "next-intl";
import { ease } from "@/lib/motion";

export function ImageReveal({ className = "", ...img }: ImageProps & { className?: string }) {
  const rtl = useLocale() === "ar";
  // Wipe from bottom (direction-neutral). For a horizontal wipe use start side:
  const hidden = "inset(100% 0% 0% 0%)"; // rtl ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)"
  return (
    <m.div
      className={`relative overflow-hidden ${className}`}
      initial={{ clipPath: hidden }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: ease.outExpo }}
    >
      <m.div className="absolute inset-0"
        initial={{ scale: 1.12 }} whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.2, ease: ease.outExpo }}>
        <Image {...img} fill className="object-cover" />
      </m.div>
    </m.div>
  );
}
```
Pure-CSS alternative on Chrome/Safari 26: `@keyframes clip { from { clip-path: inset(100% 0 0 0) } to { clip-path: inset(0) } }` with `animation-timeline: view(); animation-range: entry 10% cover 40%`. Don't use this on the LCP hero image.

### 7.5 Subtle hero parallax with Motion values (no React re-renders)

```tsx
"use client";
import { useRef } from "react";
import * as m from "motion/react-m";
import { useScroll, useTransform, useReducedMotion } from "motion/react";

export function ParallaxLayer({ children, depth = 60 }: { children: React.ReactNode; depth?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [depth, -depth]);
  return <m.div ref={ref} style={{ y }} className="will-change-transform">{children}</m.div>;
}
```
Keep `depth` ≤ 60–80 px and use at most 2–3 layers per viewport. `useScroll` hands off to native `ScrollTimeline` where available. The hero already does this (`orbitY`, `storyY`), which is good.

### 7.6 Page transitions + gallery → detail shared element (View Transitions)

```tsx
// src/app/[locale]/layout.tsx
import { ViewTransitions } from "next-view-transitions";
export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return <ViewTransitions>{/* <html>…<body>… */}{children}</ViewTransitions>;
}

// Gallery card  (src/components/gallery/…)
import { Link } from "next-view-transitions";
<Link href={`${prefix}/galerie/${cake.slug}`}>
  <div style={{ viewTransitionName: `cake-${cake.slug}` }} className="relative aspect-[4/5]">
    <Image src={cake.image} alt={tr.name} fill sizes="(max-width:768px) 50vw, 25vw" />
  </div>
</Link>

// Detail page hero  (src/app/[locale]/galerie/[slug]/page.tsx)
<div style={{ viewTransitionName: `cake-${cake.slug}` }} className="relative aspect-[4/5]">
  <Image src={cake.image} alt={tr.name} fill priority sizes="(max-width:768px) 100vw, 50vw" />
</div>
```
```css
/* globals.css — tune the default cross-fade + the morph */
::view-transition-old(root) { animation: var(--dur-base) var(--ease-in) both vt-out; }
::view-transition-new(root) { animation: var(--dur-medium) var(--ease-out) both vt-in; }
@keyframes vt-out { to   { opacity: 0; transform: translateY(-8px); } }
@keyframes vt-in  { from { opacity: 0; transform: translateY(8px); } }
::view-transition-group(*) { animation-duration: 450ms; animation-timing-function: var(--ease-in-out); }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
}
```
Rules: a `view-transition-name` must be **unique on the page at capture time**, so set it only on the card and the detail hero. Browsers without VT (older Firefox/Safari) just navigate. Also replace locale-switcher and nav links with this `Link`. Because next-intl's `Link` may wrap `next/link`, either use the VT `Link` with prefixed hrefs (as the repo already builds `prefix`) or call `useTransitionRouter().push()`. Check the project's next-intl navigation helpers when implementing. **Upgrade path:** on Next 15.2+/16 with React 19.2+, use React's `<ViewTransition>` + `experimental.viewTransition` (still marked experimental).

Alternative without leaving the page: an **intercepting-route modal** (`@modal/(.)galerie/[slug]`) with Motion `layoutId={cake.slug}` on the image (needs `domMax`). It's richer (spring, interruptible), but it adds routing complexity.

### 7.7 "Commander" CTA + add-to-order feedback

```tsx
"use client";
import * as m from "motion/react-m";
import { AnimatePresence } from "motion/react";
import { Check, MessageCircle } from "lucide-react";
import { spring, ease } from "@/lib/motion";

export function OrderButton({ added, onClick, label, addedLabel }:
  { added: boolean; onClick: () => void; label: string; addedLabel: string }) {
  return (
    <m.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={spring.snappy}
      className="relative inline-flex items-center gap-2 rounded-full bg-rose px-6 py-3 text-white overflow-hidden"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={added ? "ok" : "cta"}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.2, ease: ease.out }}
          className="inline-flex items-center gap-2"
        >
          {added ? <Check size={18} /> : <MessageCircle size={18} />}
          {added ? addedLabel : label}
        </m.span>
      </AnimatePresence>
    </m.button>
  );
}

// Badge "pop" when the order count changes (e.g. in header)
export function CountBadge({ count }: { count: number }) {
  return (
    <m.span key={count} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={spring.playful}
      className="grid h-5 min-w-5 place-items-center rounded-full bg-gold text-xs text-charcoal">
      {count}
    </m.span>
  );
}
```
Card hover (CSS, cheapest):
```html
<article class="group">
  <div class="relative overflow-hidden rounded-2xl after:absolute after:inset-0 after:rounded-2xl
              after:shadow-cake-hover after:opacity-0 after:transition-opacity after:duration-300
              hover:after:opacity-100">
    <img class="transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                group-hover:scale-[1.04] motion-reduce:transform-none" />
  </div>
</article>
```
(The shadow fades in on a pseudo-element: an opacity change instead of a `box-shadow` repaint. Add `active:scale-[0.98]` for touch feedback.)

### 7.8 RTL-aware CSS marquee (zero JS, pauses off-screen)

```tsx
export function Marquee({ items }: { items: string[] }) {
  const row = items.map((t, i) => <span key={i} className="mx-6 shrink-0">{t} <span className="text-gold">✦</span></span>);
  return (
    <div className="marquee overflow-hidden" aria-label={items.join(", ")}>
      <div className="marquee__track flex w-max" aria-hidden>
        {row}{row /* duplicate for seamless loop */}
      </div>
    </div>
  );
}
```
```css
@media (prefers-reduced-motion: no-preference) {
  .marquee__track { animation: marquee 30s linear infinite; }
  [dir="rtl"] .marquee__track { animation-direction: reverse; }
  .marquee:hover .marquee__track { animation-play-state: paused; }
}
@keyframes marquee { to { transform: translateX(-50%); } }
```
In RTL, flex order flips, so reversing the direction keeps the content flowing in reading order. Pause it off-screen by toggling a class with IO if it sits far down a long page.

### 7.9 Magnetic CTA, desktop only (optional)

```tsx
"use client";
import { useRef } from "react";
import * as m from "motion/react-m";
import { useMotionValue, useSpring } from "motion/react";

export function Magnetic({ children, strength = 0.25 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 300, damping: 20 });
  const y = useSpring(useMotionValue(0), { stiffness: 300, damping: 20 });
  const fine = typeof window !== "undefined" && matchMedia("(hover:hover) and (pointer:fine)").matches;
  if (!fine) return <>{children}</>;
  return (
    <m.div ref={ref} style={{ x, y }}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}>
      {children}
    </m.div>
  );
}
```
(Read the media query in an effect to avoid a hydration mismatch. Shown inline here for brevity.)

### 7.10 Bonus: modal entry with zero JS (`@starting-style`)

```css
dialog[open] { opacity: 1; transform: scale(1);
  transition: opacity var(--dur-medium) var(--ease-out-expo),
              transform var(--dur-medium) var(--ease-out-expo),
              overlay var(--dur-medium) allow-discrete, display var(--dur-medium) allow-discrete; }
@starting-style { dialog[open] { opacity: 0; transform: scale(0.96); } }
dialog { opacity: 0; transform: scale(0.96); }
```
This would let `CategoryPickerModal` (which uses Tailwind `animate-scale-in` today) also animate **out**, which it currently can't.

### 7.11 Phase 2 reference: GSAP pinned story (load only on that page)

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export default function CakeLayersStory() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top top", end: "+=200%", pin: true, scrub: 0.6 },
      });
      tl.from(".layer", { yPercent: -120, opacity: 0, stagger: 0.3, ease: "power3.out" })
        .from(".caption", { opacity: 0, y: 20, stagger: 0.3 }, "<0.1");
    });
  }, { scope: root });
  return <section ref={root}>{/* .layer images (sponge, cream, fruit, decor) + .caption */}</section>;
}
// Use via next/dynamic(() => import("./CakeLayersStory"), { ssr: false })
```
On mobile (`max-width: 767px`) show the static stacked version. Pinning plus scrub is the most likely thing to jank on low-end Android.

---

## 8. Checklist before shipping motion

- [ ] Lighthouse mobile (Moto G Power profile): LCP unchanged or better, CLS < 0.05, TBT not increased.
- [ ] Chrome DevTools Performance with 4× CPU throttle: no long tasks during scroll; no "Layout" or "Paint" bars from animations.
- [ ] Test on a real mid-range Android (e.g. Galaxy A1x/A2x) on 4G.
- [ ] OS "Remove animations" / reduced motion: site fully usable, no hidden content.
- [ ] Arabic: line masks don't clip diacritics; directional motion mirrors; marquee reads correctly.
- [ ] Firefox: content visible without scroll-driven animations; VT degrades to a plain navigation.
- [ ] Keyboard: focus states animate as fast as hover (≤ 160 ms) and are never hidden by transforms.

---

## Sources

- Motion: reduce bundle size (LazyMotion, `m`, sizes): https://motion.dev/docs/react-reduce-bundle-size
- Motion: upgrade guide (no breaking changes in v12, `motion/react`): https://motion.dev/docs/react-upgrade-guide
- Motion: useScroll (ScrollTimeline hardware acceleration): https://motion.dev/docs/react-use-scroll
- Motion: GSAP vs Motion comparison (vendor page, biased): https://motion.dev/docs/gsap-vs-motion
- GSAP 3.13 release (free plugins, SplitText rewrite): https://gsap.com/blog/3-13/
- GSAP Standard License: https://gsap.com/community/standard-license/
- Webflow forum, "Webflow makes GSAP 100% free": https://discourse.webflow.com/t/webflow-makes-gsap-100-free/319967
- CodePen blog, "GSAP more like FreeSAP": https://blog.codepen.io/2025/05/05/chris-corner-gsap-more-like-freesap/
- gsap-trial deprecation: https://npmjs.com/package/gsap-trial
- GSAP React / useGSAP: https://gsap.com/resources/React/
- Codrops, "From SplitText to MorphSVG: 5 Creative Demos Using Free GSAP Plugins": https://tympanus.net/codrops/?p=93244
- Lenis README (options, limitations, GSAP integration): https://cdn.jsdelivr.net/gh/darkroomengineering/lenis@1.3.26/README.md
- Lenis on npm: https://npmjs.com/package/lenis
- Chrome, scroll-driven animations: https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Scroll-driven animations cross-browser status 2026 (secondary): https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026
- Mozilla Connect, scroll-driven animations idea thread: https://connect.mozilla.org/t5/ideas/implement-css-scroll-driven-animations-animation-timeline/idc-p/100249
- Chrome, View Transition API: https://developer.chrome.com/docs/web-platform/view-transitions
- Chrome, cross-document view transitions: https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
- web.dev, New to the web platform in October 2025 (Firefox 144 VT): https://web.dev/blog/web-platform-10-2025
- web.dev, Baseline entry animations (`@starting-style`, `allow-discrete`): https://web.dev/blog/baseline-entry-animations
- web.dev, prefers-reduced-motion: https://web.dev/articles/prefers-reduced-motion
- Next.js `viewTransition` config (v15 docs): https://nextjs.org/docs/15/app/api-reference/config/next-config-js/viewTransition
- Next.js 16.2 bundled docs, viewTransition: https://unpkg.com/next@16.2.7/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/viewTransition.md
- next-view-transitions (Shu Ding): https://github.com/shuding/next-view-transitions
- Emil Kowalski, "Great animations": https://emilkowal.ski/ui/great-animations
- Emil Kowalski animation skill digest (custom easing `cubic-bezier(0.23,1,0.32,1)`; secondary): https://skills.sh/mrmps/smry/emilkowal-animations
- Josh W. Comeau, "A Friendly Introduction to Spring Physics": https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/
- Osmo, masked text reveal (pattern reference): https://www.osmo.supply/resource/masked-text-reveal

---

## Confidence / unverified

| Claim | Confidence | Note |
|---|---|---|
| GSAP fully free incl. SplitText/MorphSVG, commercial OK, from 3.13 | **High** | Confirmed on gsap.com blog, the license page, the Webflow forum and CodePen. The license is proprietary (Webflow), not OSS. |
| Motion v12 has no breaking changes vs v11; works with React 18 | **High** | Motion upgrade guide. Check that `motion/react-m` and `MotionConfig reducedMotion` behave the same after the swap. |
| Motion bundle sizes (34 / 4.6 / +15 / +25 / 2.3 kB) | **High** | From motion.dev. Actual gzip in our build will differ; measure with `@next/bundle-analyzer`. |
| GSAP core ≈ 23 kB; ScrollTrigger ≈ 10–12 kB extra | **Medium** | 23 kB comes from Motion's (competitor) page. The ScrollTrigger figure is from memory/bundlephobia, not verified this session. |
| Lenis "a few kB" | **Medium** | The README doesn't give an exact number. |
| Scroll-driven animations: Chrome 115+, Safari 26+, Firefox stable behind flag (as of mid-2026) | **Medium-high** | Chrome docs + a secondary 2026 article. Firefox may have shipped by the time we implement; check caniuse. |
| VT same-document: Chrome 111+, Safari 18+, Firefox 144+ | **High** | Chrome docs + web.dev Oct 2025. |
| Next.js `experimental.viewTransition` needs Next ≥ 15.2 and React canary/19.2; still experimental in Next 16.2 docs | **High** for "experimental", **medium** for the exact React version | It isn't usable on our Next 14 regardless. |
| `next-view-transitions` works on Next 14 App Router | **Medium** | The README says "App Router, basic use cases" without listing versions. Needs a quick spike, especially combined with next-intl's localized `Link`. |
| Motion `visualDuration` + `bounce` springs available in framer-motion 11.18 | **Medium** | Added in the 11.x line, I believe; confirm, or use stiffness/damping, which certainly work. |
| `AnimatePresence` exit on App Router route changes is unreliable | **Medium-high** | Widely reported community issue; not re-verified this session. |
| Emil's `cubic-bezier(0.23, 1, 0.32, 1)` recommendation | **Medium** | Taken from secondary skill digests of his animations.dev course. The primary article confirms "ease-out" and "< 300 ms" but not the exact curve. |
| Easing, duration and spring token values | Opinion / industry convention | Starting points. Tune by eye on a real device. |
| Arabic char-splitting breaks letter joining | **High** | Typographic fact: wrapping each letter in its own span breaks the shaping context. |
