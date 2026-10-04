# 21st.dev for the Gateaux Patience revamp: what it is, how Claude Code uses it, and how to do it safely

> Research date: 2026-10-04. Audience: the developer(s) working on the Gateaux Patience site (Next.js 14 App Router, Tailwind 3.4, framer-motion 11, next-intl FR/AR/EN).
> Scope: research only. Nothing was installed and no project code or config was changed.

---

## TL;DR

- **21st.dev ("21st") is a community catalog of more than 12,000 React + Tailwind + TypeScript components**, plus templates, shadcn themes, icons and SVG logos. It is built on the **shadcn registry format**: each component has a registry URL `https://21st.dev/r/<author>/<slug>` that the shadcn CLI can install. The code is copied into your repo, so you own it and nothing is added at runtime.
- **The "Magic" brand is gone (renamed in 2026).** *Magic MCP* is now the **21st MCP** (`https://21st.dev/api/mcp`, an HTTP MCP server). *Magic Chat* is now **21st AI**. **All old Magic API keys were reset.** The `/ui` trigger is retired, so you just ask in plain language. Old tool names (`21st_magic_component_builder`, etc.) are still accepted and mapped to new ones (`generate`, `get_inspiration`, `search_logo`).
- **Installing a component now requires an API key**, even for public components: `npx shadcn@latest add "https://21st.dev/r/<author>/<slug>?api_key=$API_KEY_21ST"`. Without a key the registry endpoint returns `{"error":"Authentication required"}` (verified).
- **Pricing:** the Free plan gives **2 code retrievals per day in total** (across web, MCP and CLI). Search, previews, inspiration and logo search are free and unlimited. **Builder costs $6/mo billed yearly or $8/mo billed quarterly** and gives unlimited installs and MCP code retrieval. **AI generation (`generate`) needs "Builder + AI"**, from $15/mo for 500 credits. For a full revamp, **Builder is the practical minimum. AI generation is optional and probably not worth paying for**, because Claude Code can adapt catalog code itself.
- **Tailwind v3 compatibility is the main risk.** The registry and the shadcn CLI now target Tailwind v4 by default (OKLCH tokens, `@theme`, `size-*`, v4 ring and border defaults). Our project is **Tailwind 3.4.19, has no `components.json` and no shadcn semantic tokens** (`primary`, `muted-foreground`, `ring`, `popover`…). Our `background` and `border` colors are brand hex values, and `shadcn init` would overwrite them. **Recommendation: do not run `shadcn init` and do not blindly `shadcn add`.** Retrieve the code with the MCP `get_component` tool (or `21st get <id>`), then have Claude port it by hand: Tailwind v3 classes, brand tokens, `framer-motion` instead of `motion/react`, logical RTL classes, `next/image`, `"use client"`.
- **Licenses vary per component.** Many are MIT, but a notable share are listed as `unknown` or `no-license` (examples below). **Only ship MIT or similarly licensed components on this commercial site.**
- **What the user must do:** create a 21st account, choose a plan (Builder recommended) and create an API key at https://21st.dev/mcp. Then run one `claude mcp add` command, or approve it, and restart Claude Code. **What Claude can do alone:** everything else, including browsing the catalog through the free markdown pages, vetting licenses and dependencies, retrieving code through MCP once connected, porting, RTL/i18n wiring and verification.

---

## 1. What 21st.dev is (current state, October 2026)

| Aspect | Current reality |
|---|---|
| Product | "Community catalog of 12,000+ hand-crafted React and Tailwind CSS components, templates, and component libraries." There are two actions: **Find** (registry) and **Generate** (21st AI). They are available on three surfaces: web, MCP and CLI. |
| Company | Founded by Serafim Korablev and Sergey Bunas, Y Combinator W26. Self-described as "the npm for design engineers". |
| Component format | React + Tailwind + TypeScript, "shadcn/ui-compatible", with live previews and copyable TSX. |
| Install mechanism | shadcn registry items at `https://21st.dev/r/<author>/<slug>`, installed with the shadcn CLI or `21st add`. |
| Hosted libraries | Aceternity UI, Magic UI (Dillion Verma; unrelated to the old "Magic" product name), Origin UI, Motion Primitives (ibelick), Kokonut UI, ReUI, HextaUI, cult/ui, and hundreds of individual authors. |
| Other surfaces | Templates (some paid per template), Themes, Icons (7 families, plus animated icons), SVG logo search (svgl), an "Open-source apps" directory (September 2026), and **Design Bug Bot**, an AI design review for GitHub PRs (5 free reviews, then AI credits). |
| Agent-friendly docs | Add `.md` to most URLs to get a markdown version (e.g. `https://21st.dev/@dillionverma/components/blur-fade.md`). Also available: `llms.txt`, `openapi.json`, `/.well-known/skills/index.json` and `auth.md`. **No key is needed for these.** |

### Name changes you will run into in older blog posts and tutorials

| Old name | New name | Notes |
|---|---|---|
| Magic MCP (`@21st-dev/magic`) | **21st MCP** (`https://21st.dev/api/mcp`) | `@21st-dev/magic` v0.2.x is now a thin stdio proxy to the same server. |
| Magic Chat (`/magic-chat`, `/magic`) | **21st AI** (`https://21st.dev/ai`) | Old URLs redirect. |
| `@21st-dev/registry` | `@21st-dev/cli` (bin `21st`, v1.17.1, MIT) | One CLI for search, install, publish, generate and MCP config. |
| `/ui`, `/21` trigger phrases | Plain-language requests | The FAQ says these were a convention of the old tool descriptions, not part of the protocol. |
| Old Magic API keys | **Reset; they no longer work** | Generate a new key at https://21st.dev/mcp. Keys look like `21st_sk_…`. |

### Install syntax (verified on component pages)

Every component's `.md` page shows:

```bash
npx shadcn@latest add "https://21st.dev/r/<author>/<slug>?api_key=$API_KEY_21ST"
```

Alternatives:

```bash
21st add <author>/<slug>              # resolves the item and runs shadcn under the hood; writes components/ui/<slug>.tsx
21st add <author>/<slug> --print      # only prints the shadcn command (safe preview)
21st get <id>                         # prints code + demo to stdout (metered), so no files are written
```

On Windows PowerShell, the variable is `$env:API_KEY_21ST`, not `$API_KEY_21ST`. Also note that putting the key in the URL leaves it in shell history and logs. The `21st` CLI with `21st login` avoids this.

### What an install pulls into a project

Based on the metadata of about 40 relevant components (see section 5):

- **Animation:** mostly `motion` (the renamed framer-motion, v12+, imported as `motion/react`) or `framer-motion`. We already have `framer-motion@11.18.2`. Installing `motion` as well would add a second copy of the animation runtime, so **rewrite `motion/react` imports to `framer-motion`.** The APIs used by typical components (`motion.div`, `useScroll`, `useTransform`, `useInView`, `AnimatePresence`, `useMotionValue`, `useSpring`) are the same.
- **Icons:** mostly `lucide-react` (already installed). Some components use `@tabler/icons-react` or `react-icons`; swap these for lucide to avoid extra packages.
- **Misc:** `react-use-measure`, `react-wrap-balancer`, occasionally `next` (for `next/image`), shaders (`ogl`, `three`, raw WebGL) in background effects, and **Radix primitives** (`@radix-ui/react-*`) plus shadcn `registryDependencies` (`button`, `card`, `carousel` → `embla-carousel-react`) for anything built on shadcn primitives.
- **CSS:** registry items can carry `cssVars`, `tailwind.config` extensions (keyframes and animations) and, for v4-era items, `@theme` and OKLCH variables. **This is where the Tailwind v3/v4 mismatch bites** (section 1.1).

### 1.1 Tailwind v3 vs v4 compatibility (critical for us)

Facts:

- The shadcn docs say: "**If you are using Tailwind v3, use `shadcn@2.3.0`.**" `shadcn@latest` targets Tailwind v4 and React 19 for new projects. Existing v3 apps "will still work", and the docs say new components "will still be in v3 and React 18 until you upgrade".
- 21st's own blog ("shadcn Tailwind v4 migration", 2026-08-20) warns: "Quality varies by author, so **check the version it expects**." It also lists v3 vs v4 differences that break things silently: `ring` is 3px in v3 and 1px in v4; the default border color is grey in v3 and `currentColor` in v4; OKLCH palette; config moved from JS to `@theme`; renamed utilities.
- Our project: `tailwindcss@3.4.19`, a JS `tailwind.config.ts` with **custom flat colors** (`background: "#FFF8F3"`, `border: "#E8D5C4"`, `rose`, `gold`, `charcoal`, `cream`, …), `globals.css` with `@tailwind` directives and `* { @apply border-border }`. There is **no `components.json`** (verified) and there are **no shadcn tokens** (`primary`, `foreground`, `muted`, `accent`, `card`, `popover`, `ring`, `input`, `destructive`). `src/lib/utils.ts` already exports a shadcn-style `cn()` built on clsx and tailwind-merge 2.5, which is the correct version for Tailwind v3.

What goes wrong if you install a typical 21st component as-is:

| Symptom | Cause | Fix when porting |
|---|---|---|
| Colors are missing (transparent backgrounds, invisible text) | `bg-primary`, `text-muted-foreground`, `border-input` and similar are not defined in our config | Map them to brand tokens (`bg-rose`, `text-charcoal-light`, `border-border`), or add a small semantic token layer (see the option below) |
| `size-4`, `text-balance`, `inset-shadow-*`, `bg-linear-*`, `@container` and others do nothing | These are v4 utilities (some exist in 3.4, some do not) | Use `h-4 w-4`, `bg-gradient-to-*` and similar |
| Animations do nothing | A v4 item declares keyframes in `@theme` or CSS, but our config never receives them | Copy the keyframes into `tailwind.config.ts` → `extend.keyframes/animation` |
| OKLCH colors in `:root` | v4 themes | Convert to hex/HSL brand colors |
| `shadcn init` rewrites `tailwind.config.ts` and `globals.css` and changes `background`/`border` to `hsl(var(--…))` | init assumes it owns the theme | **Do not run init** in this repo without a deliberate token plan |

**Recommended stance:**

1. **Default: retrieve code and port it manually.** Use MCP `get_component` or `21st get <id>`. Nothing is written to disk, and Claude adapts the code into `src/components/ui/…` with our tokens. This avoids `components.json` and config churn completely.
2. **Optional, later:** if we want shadcn primitives (Dialog, Sheet, Tabs…), add a `components.json` created **by hand** (style `new-york`, `tailwind.config: "tailwind.config.ts"`, `cssVariables: true`, aliases `@/components`, `@/lib/utils`). Then add **additional** semantic CSS variables (`--primary` = rose, `--ring` = gold, …) without touching our existing brand colors, and use `npx shadcn@2.3.0 add …` (the version for Tailwind v3). Test on a branch first.
3. Upgrading the site to Tailwind v4 is a separate, larger decision. It is not required in order to use 21st.

---

## 2. The 21st MCP server (formerly Magic MCP) with Claude Code

### 2.1 Endpoint and authentication

| Item | Value |
|---|---|
| Transport | Remote **HTTP** MCP (streamable HTTP) |
| Full endpoint | `https://21st.dev/api/mcp` |
| Read-only endpoint | `https://21st.dev/api/mcp/readonly` |
| Auth option A | API key `21st_sk_…`, sent as `x-api-key: <key>` or `Authorization: Bearer <key>` |
| Auth option B | **OAuth 2.1** (Clerk, dynamic client registration). An unauthenticated call returns 401 with `WWW-Authenticate` resource metadata. 21st's auth.md says MCP clients that implement the MCP auth spec, Claude among them, "do all of this automatically". |
| Where keys come from | https://21st.dev/mcp (or https://21st.dev/settings/api-keys). The user must be signed in. |
| Env var names accepted by tooling | `API_KEY_21ST` (plugin, shadcn URL), `TWENTYFIRST_TOKEN` (CLI), `TWENTY_FIRST_API_KEY` (legacy proxy) |

### 2.2 Install commands for Claude Code (Windows 11)

Pick **one** of these.

**A. Remote HTTP server with an API key (recommended; most explicit).** The user scope keeps the key out of the repo:

```powershell
claude mcp add --transport http --scope user 21st https://21st.dev/api/mcp --header "x-api-key: 21st_sk_XXXXXXXX"
```

**B. Remote HTTP server with OAuth (no key to paste).** Add the server, then run `/mcp` inside Claude Code and choose *Authenticate*. A browser sign-in to 21st follows:

```powershell
claude mcp add --transport http --scope user 21st https://21st.dev/api/mcp
```

**C. Let 21st's CLI print the config.** This prints a config with a key placeholder; `--write` writes it:

```powershell
npx @21st-dev/cli@latest init --client claude
```

**D. Claude Code plugin.** This bundles the MCP server and a UI skill. The plugin reads `API_KEY_21ST` from the environment:

```powershell
setx API_KEY_21ST "21st_sk_XXXXXXXX"      # then open a NEW terminal
claude plugin marketplace add 21st-dev/magic-mcp
# inside Claude Code:  /plugin install 21st
```

**E. Project-scoped `.mcp.json` without committing the secret.** Claude Code expands `${VAR}` in `.mcp.json`:

```json
{
  "mcpServers": {
    "21st": {
      "type": "http",
      "url": "https://21st.dev/api/mcp",
      "headers": { "x-api-key": "${API_KEY_21ST}" }
    }
  }
}
```

After any of these, restart Claude Code and check the connection with `claude mcp list` or `/mcp`.

**Legacy, still works but not recommended:** `claude mcp add magic -- npx -y @21st-dev/magic@latest API_KEY="..."`. This runs a stdio proxy to the same endpoint, and on Windows it may need `cmd /c npx …`.

> Note: the magic-mcp README also mentions `claude mcp add 21st-dev/magic-mcp`. That is not valid `claude mcp add` syntax; use A, B or D above.

### 2.3 Tools exposed

According to 21st, the authoritative list comes from the server's `tools/list` and depends on the account.

| Tool | What it does | Cost |
|---|---|---|
| `search` | Searches components, themes and templates. Returns metadata only. | Free |
| `get_component` | Returns a component's full code and demo by id | **Metered**: 2/day on Free, unlimited on Builder |
| `get_inspiration` | Search re-ranked against the project's "Design Context" (`.21st/design.json`) | Free ("Unlimited UI Inspirations") |
| `search_logo` | SVG brand logos (svgl) | Free, unlimited |
| `get_usage` | Tier, quota, `aiGenerationEnabled` | Free |
| `generate` / `iterate_generation` | Hosted 21st AI generation; returns a URL to watch, not inline code | **AI credits.** Only listed when AI is enabled; otherwise `ai_subscription_required` |
| Others | Bookmarks, lists, teams, themes, templates, profile | Varies |

Legacy name mapping: `21st_magic_component_builder` and `21st_magic_component_refiner` → `generate`; `21st_magic_component_inspiration` → `get_inspiration`; `logo_search` → `search_logo`.

### 2.4 How to prompt it (there is no `/ui` anymore)

Ask in natural language and be specific about constraints. Examples:

- "Search 21st for an editorial image-collage hero with motion, light theme. Show me 5 options with author, license and dependencies before retrieving anything."
- "get_component for id 1234, then port it into `src/components/ui/collage-hero.tsx` for Tailwind 3.4, our brand tokens, framer-motion 11, RTL-safe."
- "search_logo instagram, tiktok, whatsapp." This is useful for the social and contact sections.

Because `get_component` is the metered call, Claude should **search, shortlist and vet first, and retrieve only the final picks.** On the Free plan that means 2 per day.

### 2.5 Pricing (from https://21st.dev/pricing.md, October 2026)

| Plan | Price | What it unlocks |
|---|---|---|
| Free (Hobby) | $0 | Browse everything; search, inspiration and logo search unlimited; **2 copies/installs/retrievals per day total**; 5 Design Bug Bot reviews |
| **Builder** | **$6/mo (yearly) or $8/mo (quarterly)** | **Unlimited installs and MCP `get_component`**; no AI credits |
| Builder + AI | $15 / $30 / $60 per month (yearly) for 500 / 1,000 / 2,000 credits; $20 / $40 / $80 (quarterly) | Adds `generate`, code mode, multi-model sketch, iterate. +100 credits for $5, which roll over |
| Team | $7.50 per seat (no AI) or $18.75 per seat (AI), billed yearly | Shared collections, admin controls |

Note: the plans appear to be billed yearly or quarterly; no monthly option is listed. The 21st blog says "installs require a membership", while the pricing page says the Free plan includes 2 per day. Treat the Free plan as only good enough for a trial.

---

## 3. Other 21st products: are they relevant?

| Product | What it is | Relevance to this project |
|---|---|---|
| **21st Agent Skills** (`/.well-known/skills/index.json`; `21st skills install`) | Seven SKILL.md files: `21st-cli-use`, `21st-ui-build`, `21st-ui-explore`, `21st-ui-review`, `21st-ai`, `21st-registry`, `21st-design-sync` | **Useful as reading material.** The `21st-ui-build` workflow (read the design context, search before generating, reuse project primitives, preserve a11y and reduced motion) is sound. Installing the skills is optional. Note that `21st-cli-use` "auto-activates when a project has `components.json`". |
| **`21st init --design-context`** | Writes `.21st/design.json` and `.21st/DESIGN.md` (stack, tokens, decisions), used by `get_inspiration` and `search --context auto` | Optional and moderately useful. It writes files into the repo, so do it deliberately. |
| **`21st review <path> [--fix]`** | Deterministic local UI lint (a11y, touch targets, reduced motion, hardcoded values) | **Useful** as a free QA pass after porting. Run it without `--fix` first. |
| **Design Bug Bot** | AI design review on GitHub PRs | Optional. 5 free reviews, then AI credits. |
| **21st AI** (formerly Magic Chat) | Prompt to component variants (code or sketch mode) | Low priority. Claude Code can build or adapt components itself, and generated output still has to be ported to our Tailwind v3 and token setup. |
| **21st Agents SDK** (YC W26 launch: hosted agent infrastructure with sandboxing, chat UI and billing) | Infrastructure for shipping AI agents inside apps | **Not relevant** to a patisserie marketing site. As of October 2026, `21st.dev/agents` redirects to the homepage, so the product may have moved or been retired. |
| Templates / Open-source apps | Full-page starters, some paid | Only for ideas. Our app already exists. |

---

## 4. Licensing, quality, RTL, bundle size: how to vet a component

### 4.1 Licensing

Each component page lists a license, and **it varies**. From our sample:

- MIT: Blur Fade, Infinite Slider, Text Along Path, Hero Parallax, Stacking Cards, Hover Expand, 3D Carousel, Parallax Floating, Scroll word reveal, Coverflow Carousel, Floral Veil, Testimonials Columns, Apple Card Carousel, Centered Hero with Image Fan, Minimalist Hero Fashion, Carousel Cards, Shine Border, Text Roll, Dot Pattern, Progressive blur, Beams Background, Circular Testimonials.
- **`unknown` or `no-license`**: Editorial Collage Hero, Gallery with image cards (shadcnblocks gallery4), 3D Marquee, Elegant Carousel, Zoom Parallax, Menu Item Card, Product Reveal Card, Image Gallery (efferd), CTA 3, Testimonials Marquee (shadcnspace).

**Rule for this project:** ship only MIT, Apache-2.0 or ISC components. With `unknown` or `no-license`, the default is "all rights reserved", so treat them as inspiration only and rebuild the idea from scratch. Keep a short `THIRD_PARTY_NOTICES` list (component, author, URL, license) for anything shipped. MIT asks you to retain the notice.

### 4.2 Quality caveats

- These are community uploads and quality varies (21st's own words). Common problems: demo-only hardcoded content, no `prefers-reduced-motion` handling, `<img>` instead of `next/image`, missing `"use client"`, dark-theme-only styling, very large hero fonts, `window` access during SSR, scroll listeners without cleanup, and inaccessible carousels (no buttons, labels or keyboard support).
- Many components are aimed at SaaS or dark tech sites (shaders, neon, grids). A patisserie needs **soft, warm, editorial, photo-led** motion. Most of the value comes from galleries, image reveals, text reveals and subtle backgrounds, not from flashy shader effects.

### 4.3 RTL (Arabic) concerns

- Watch for physical classes (`ml-*`, `pl-*`, `left-*`, `text-left`, `rounded-l-*`, `border-l`) and direction-baked motion (`x: -100` slide-ins, marquee direction, carousel `translateX`, `rotateY` fans). Tailwind 3.4 already supports the logical equivalents (`ms-/me-/ps-/pe-/start-/end-`, `text-start`, `rounded-s-*`, `border-s`) and the `rtl:`/`ltr:` variants. Our `<html dir>` is already set per locale in `src/app/[locale]/layout.tsx`.
- shadcn added first-class RTL in January 2026 (`"rtl": true` in `components.json`, plus `shadcn migrate rtl`). That is a `shadcn@latest`-era (v4) feature, and it is **not verified on Tailwind v3**. Do the conversion by hand while porting instead.
- For carousels, use embla's `direction: 'rtl'` (embla 8 is already installed) or Swiper's `dir`. For marquees and scroll-velocity text, flip the sign of the velocity under RTL.
- Text effects that split text into letters (`letter swap`, `scramble`, `hyper text`, `vertical cut reveal characters`) **break Arabic**, because Arabic letters connect and splitting them destroys the shaping. Under `ar`, use word-level or line-level reveals, or a simple fade.

### 4.4 Bundle size and performance

- Shader and WebGL backgrounds (Aurora, Waves shader, Shader Dithering, Particle Wave) and canvas particle effects are heavy and drain mobile batteries. If used at all, load them with `next/dynamic(..., { ssr: false })`, pause them off-screen, and disable them under reduced motion. We already ship `three` and `@react-three/*` for the tiramisu configurator, so do not pull more 3D into the home page.
- Do not add `motion` alongside `framer-motion`. Rewrite the imports. Do not add `react-icons` or `@tabler/icons-react`; use lucide.
- Prefer CSS-only effects (gradients, `background-image` patterns, keyframes) for backgrounds.
- Keep components as small client islands inside server components (App Router).

### 4.5 Vetting checklist (Claude runs this before every `get_component`)

1. Open `https://21st.dev/@<author>/components/<slug>.md` (free, no key) and read the license, npm dependencies and tags.
2. Reject it if the license is unknown or missing, if it has dependencies we don't want (shaders, `react-icons`, a second animation library), or if it is dark/SaaS-only in a way that would take a rewrite.
3. Check the live preview on mobile width (the user can do this by eye; Claude cannot render it).
4. Retrieve the code (metered) and check for: `"use client"`, SSR safety, cleanup of listeners and observers, reduced-motion handling, a11y (roles, labels, focus, keyboard), v4-only utilities, physical left/right classes, letter-splitting text.
5. Port it: Tailwind v3 classes, brand tokens, `framer-motion`, `next/image`, logical classes, `next-intl` strings (no hardcoded copy), `prefers-reduced-motion`.
6. Verify: `npm run lint`, `npm run build`, manual check in FR, AR (RTL) and EN on mobile, Lighthouse, and optionally `21st review <path>`.

---

## 5. Component shortlist for a luxury patisserie site

All URLs are of the form `https://21st.dev/@author/components/slug` (add `.md` for the free metadata page). License and dependencies were taken from each page's `.md` in October 2026. Fit uses ★ to ★★★ (subjective, for our brand: warm, cream, rose and gold, photo-led, editorial).

### Heroes

| Component | URL | License | Deps | Fit / notes |
|---|---|---|---|---|
| Centered Hero with Image Fan | https://21st.dev/@felipemenezes098/components/hero-10 | MIT | motion, react-wrap-balancer | ★★★ A fan of cake photos behind the headline. Mirror the fan rotation under RTL. |
| Minimalist Hero Fashion | https://21st.dev/@kokonutd/components/hero-fashion | MIT | motion | ★★★ An editorial, fashion-style layout suits a cake designer. |
| Scroll media expansion hero | https://21st.dev/@arunachalam/components/scroll-expansion-hero | MIT | next, framer-motion | ★★★ The image or video expands to full-bleed on scroll, a strong "wow" moment for a signature cake. |
| Hero Parallax (Aceternity) | https://21st.dev/@manuarora700/components/hero-parallax | MIT | framer-motion | ★★ Rows of product images in a tilted parallax. Heavy on images, so lazy-load. |
| Editorial Collage Hero | https://21st.dev/@felipemenezes098/components/hero-04 | **no-license** | motion | Inspiration only |

### Galleries and carousels (portfolio of cakes)

| Component | URL | License | Deps | Fit / notes |
|---|---|---|---|---|
| Hover Expand | https://21st.dev/@educalvolpz/components/hover-expand | MIT | motion | ★★★ Accordion-style image strips that expand on hover or tap. Good for categories (weddings, birthdays, tiramisu). |
| Apple Card Carousel | https://21st.dev/@shadcnspace/components/carousel-08 | MIT | lucide-react | ★★★ Large rounded cards with story text. |
| 3D Carousel (cult/ui) | https://21st.dev/@cult-ui/components/3d-carousel | MIT | framer-motion | ★★ A rotating cylinder of images. Use sparingly. |
| Coverflow Carousel (Ruixen) | https://21st.dev/@ruixen.ui/components/coverflow-carousel | MIT | lucide-react | ★★ Classic coverflow. Needs RTL work. |
| Parallax Grid Scroll (Aceternity) | https://21st.dev/@manuarora700/components/parallax-scroll | MIT | framer-motion | ★★★ A three-column masonry where the columns scroll at different speeds. Good for the gallery page. |
| Infinite Slider (Motion Primitives) | https://21st.dev/@ibelick/components/infinite-slider | MIT | framer-motion, react-use-measure | ★★ A strip of cakes or press logos. Reverse it in RTL. |
| Carousel Cards (Kokonut) | https://21st.dev/@kokonutd/components/carousel-cards | MIT | next, lucide-react | ★★ |
| Gallery with image cards (shadcnblocks gallery4) | https://21st.dev/@shadcnblockscom/components/gallery4 | **no-license** | lucide-react | Inspiration only |
| Zoom Parallax | https://21st.dev/@efferd/components/zoom-parallax | **unknown** | framer-motion | Inspiration only. The effect (images zooming out on scroll) is easy to rebuild. |

### Scroll storytelling (the "how a cake is made" or "order process" sections)

| Component | URL | License | Deps | Fit |
|---|---|---|---|---|
| Stacking Cards (Daniel Petho / fancy components) | https://21st.dev/@danielpetho/components/stacking-cards | MIT | motion | ★★★ Sticky stacked cards for the 4 order steps. |
| Scroll word reveal (Motion) | https://21st.dev/@motiondotdev/components/motion-scroll-word-reveal | MIT | motion | ★★★ Word-level, so it is Arabic-safe. Good for the About / brand story. |
| Parallax Floating | https://21st.dev/@danielpetho/components/parallax-floating | MIT | motion | ★★★ Floating images that follow the mouse. Good for cut-out macarons, berries and flowers. Turn it off on touch devices. |
| Text Along Path | https://21st.dev/@danielpetho/components/text-along-path | MIT | motion | ★★ Script text curving around a cake. Latin only. |

### Text effects

| Component | URL | License | Deps | Notes |
|---|---|---|---|---|
| Blur Fade (Magic UI) | https://21st.dev/@dillionverma/components/blur-fade | MIT | framer-motion | ★★★ A universal section-entrance effect. Arabic-safe. |
| Text Roll (Motion Primitives) | https://21st.dev/@ibelick/components/text-roll | MIT | motion | ★★ Letter-based, so use it for Latin locales only. |
| Morphing Text (Magic UI) | https://21st.dev/@dillionverma/components/morphing-text | MIT | — | ★★ "Mariage · Anniversaire · Baptême" cycling. Test it with Arabic. |
| Text Reveal (Cnippet) | https://21st.dev/@cnippet-dev/components/text-reveal | MIT | motion | ★★ |

### Testimonials and social proof

**Use only real reviews.** The last commit removed fake reviews, so these components should render genuine Google or Instagram reviews.

| Component | URL | License | Deps |
|---|---|---|---|
| Testimonials Columns (efferd) | https://21st.dev/@efferd/components/testimonials-columns-1 | MIT | motion |
| Circular Testimonials | https://21st.dev/@maxim.bort.devel/components/circular-testimonials | MIT | react-icons → swap to lucide, framer-motion |
| Testimonials Marquee (shadcnspace) | https://21st.dev/@shadcnspace/components/marquee-01 | **no-license** | Inspiration only |

### Backgrounds and accents

| Component | URL | License | Notes |
|---|---|---|---|
| Floral Veil (Serafim) | https://21st.dev/@serafimcloud/components/floral-veil | MIT | ★★★ A soft gradient that can be re-tinted to cream and rose. |
| Dot Pattern (Magic UI) | https://21st.dev/@dillionverma/components/dot-pattern | MIT | ★★ Subtle texture. CSS/SVG only. |
| Progressive blur (Motion Primitives) | https://21st.dev/@ibelick/components/progressive-blur | MIT | ★★ Fade edges for strips of images. |
| Shine Border (Magic UI) | https://21st.dev/@dillionverma/components/shine-border | MIT | ★★★ A gold shimmer border on the "Order now" or featured cards. |
| Beams Background (Kokonut) | https://21st.dev/@kokonutd/components/beams-background | MIT | ★ Too "tech" unless re-tinted. |

### Product and menu cards, CTAs

| Component | URL | License | Notes |
|---|---|---|---|
| Menu Item Card | https://21st.dev/@ravikatiyar162/components/menu-item-card | **unknown** | The concept fits a cake menu; rebuild it ourselves. |
| Product Reveal Card | https://21st.dev/@isaiahbjork/components/product-reveal-card | **unknown** | Inspiration only |
| CTA 3 (efferd) | https://21st.dev/@efferd/components/cta-3 | **unknown** | Inspiration only |

Category indexes worth browsing (free `.md`):
- https://21st.dev/community/components/s/hero
- https://21st.dev/community/components/s/gallery
- https://21st.dev/community/components/s/image-gallery
- https://21st.dev/community/components/s/carousel
- https://21st.dev/community/components/s/parallax
- https://21st.dev/community/components/s/scroll
- https://21st.dev/community/components/s/text-animation
- https://21st.dev/community/components/s/testimonials
- https://21st.dev/community/components/s/background
- https://21st.dev/community/components/s/product-card
- https://21st.dev/community/components/s/cta
- https://21st.dev/community/components/s/marquee

Libraries to favor, because they are consistently licensed and well built: **Motion Primitives (ibelick)**, **Magic UI (dillionverma)**, **fancy components (danielpetho)**, **Aceternity (manuarora700)**, **Kokonut UI**, **cult/ui**, and **Motion (motiondotdev)**.

---

## 6. Workflow for Claude Code on this project

### 6.1 Who does what

| Step | Who | Details |
|---|---|---|
| Create a 21st account | **User** | https://21st.dev/sign-in (Clerk) |
| Choose a plan | **User** (it involves payment) | Builder ($6–8/mo) for unlimited retrieval during the revamp. Skip "+ AI" unless they explicitly want hosted generation. |
| Create an API key | **User** | https://21st.dev/mcp, giving a `21st_sk_…` key. Treat it like a password. Do not paste it into chat if avoidable; set it as a user env var with `setx API_KEY_21ST "…"` or put it straight into the `claude mcp add` command. |
| Register the MCP server | **User runs it, or approves Claude running it** | Command A or B in section 2.2 (user scope). Changing MCP config is a config change, so it needs the user's explicit consent. |
| Restart Claude Code and check `/mcp` | **User** | If using OAuth (option B), complete the browser sign-in. |
| Browse and shortlist the catalog | **Claude alone, no key** | WebFetch `https://21st.dev/community/components/s/<tag>.md` and the component `.md` pages for license and dependencies. |
| Look at live previews | **User** (visual) | Claude can't see the animations. It sends the user 3–5 preview URLs per section to pick from. |
| `search`, `search_logo`, `get_usage` | **Claude** (free, once MCP is connected) | |
| `get_component` (metered) | **Claude**, only for picks the user approved | Up to 2/day on Free. |
| Port the code into the repo | **Claude** | `src/components/ui/<name>.tsx` and section components in `src/components/home/…`. Steps from 4.5. |
| Installing new npm packages (if one is truly unavoidable) | **Claude proposes, user approves** | Default: none. Everything the shortlist needs is already installed (framer-motion, lucide, embla, clsx, tailwind-merge). |
| Lint, build, RTL/mobile check | **Claude** (and the user for a final visual sign-off) | `npm run lint`, `npm run build`, `npm run dev` checked in `/fr`, `/ar`, `/en`. |
| `components.json` / `shadcn init` / Tailwind v4 upgrade | **User decision** | Not needed for this workflow. Discuss before doing it. |

### 6.2 Step by step

1. **Define the design direction first** (fonts, palette, motion language, section list). 21st supplies building blocks, not a brand. Use the existing tokens: cream `#FFF8F3`, rose `#C9727A`, gold `#D4AF37`, charcoal, Playfair/Great Vibes/Inter/Cairo.
2. **Shortlist without spending quota:** for each section (hero, signature creations, categories, how to order, story, testimonials, Instagram, CTA, footer), Claude reads the category `.md` pages and vets 3–5 candidates on license, dependencies and RTL risk.
3. **User picks** from the preview links.
4. **Retrieve:** call MCP `get_component` (or `21st get <id>`) for each pick. Do not use `shadcn add`, so that `tailwind.config.ts` and `globals.css` are never rewritten.
5. **Port each component.** Checklist:
   - `"use client"` at the top; keep it a leaf island.
   - `motion/react` → `framer-motion`; other icon sets → `lucide-react`.
   - v4 utilities and shadcn tokens → v3 utilities and brand tokens; copy any keyframes into `tailwind.config.ts`.
   - `<img>` → `next/image` with `sizes`, using the S3 remote patterns already configured.
   - `left/right/ml/pl/text-left` → logical classes; direction-aware motion via `useLocale()` or `document.dir`.
   - All copy comes from `messages/{fr,ar,en}.json` through `next-intl`.
   - `useReducedMotion()` fallback; keyboard and ARIA for carousels.
   - Add an attribution comment at the top (source URL, author, license).
6. **Integrate section by section** behind the existing home components (`HeroSection.tsx`, `FeaturedCakes.tsx`, `HowToOrderSection.tsx`, …) so each change can be reviewed on its own.
7. **Verify:** lint and build; check all three locales on mobile; Lighthouse (LCP image priority on the hero, CLS); optionally run `npx @21st-dev/cli review src/components/home` without `--fix`.
8. **Record** the shipped third-party components and their licenses.

### 6.3 If the user doesn't want an account or plan

Claude can still use 21st as a **free inspiration catalog**: the metadata, the live previews (viewed by the user) and its knowledge of these well-known open-source libraries. Several of them (Motion Primitives, Magic UI, fancy components, Aceternity) are also published on their own MIT GitHub repos and sites, where the source can be read without 21st's paywall. Claude can then build equivalents directly. This takes slightly longer but costs nothing.

---

## 7. Confidence / unverified

| Claim | Confidence | Notes |
|---|---|---|
| Rename Magic MCP → 21st MCP, endpoint, key reset, new tool names, no `/ui` | **High** | From the official README, llms.txt and mcp.md (October 2026) |
| Install syntax `npx shadcn@latest add "https://21st.dev/r/<author>/<slug>?api_key=$API_KEY_21ST"` and that a key is required | **High** | Shown on component pages; the registry URL without a key returned "Authentication required" |
| Pricing figures | **High**, as of 2026-10-04 | From pricing.md. Prices can change. The blog says "installs require a membership", which conflicts with "2 free copies/day". |
| `claude mcp add --transport http … --header "x-api-key: …"` works | **Medium-high** | Standard Claude Code syntax plus the documented header. Not executed (no installs allowed). |
| OAuth sign-in from Claude Code via `/mcp` (option B) | **Medium** | 21st's auth.md says MCP-auth clients including Claude handle it automatically. Not tested. |
| `claude plugin marketplace add 21st-dev/magic-mcp` then `/plugin install 21st` | **Medium** | From the README. Not tested on Windows. |
| What `npx @21st-dev/cli init --client claude` prints exactly | **Unverified** | Not run, to avoid downloading or executing packages. |
| How `shadcn@latest add <21st url>` behaves in our Tailwind v3 repo without `components.json` | **Unverified** | It will likely prompt to init and may rewrite the config. That is why the plan avoids it. |
| Whether shadcn `rtl: true` transforms work with Tailwind v3 / `shadcn@2.3.0` | **Unverified** | Likely v4/latest only |
| Exact code quality of each listed component (`"use client"`, v3/v4 classes, a11y) | **Unverified** | Reading the code requires a key. Only metadata (license and dependencies) was verified. |
| Status of the 21st Agents SDK | **Low** | `/agents` now redirects to the homepage. Irrelevant to this project either way. |
| `get_usage` and other extended tools beyond the 5 core ones | **Medium** | Documented in the README and skills. The actual list depends on the account (`tools/list`). |

---

## Sources

- 21st homepage: https://21st.dev
- 21st llms.txt (product summary, renames, categories, pricing model): https://21st.dev/llms.txt
- 21st MCP docs: https://21st.dev/mcp.md (setup UI: https://21st.dev/mcp)
- 21st AI docs: https://21st.dev/ai.md
- Pricing: https://21st.dev/pricing.md
- Agent auth (OAuth, API key, endpoints): https://21st.dev/auth.md
- Changelog: https://21st.dev/changelog.md
- Agent skills index: https://21st.dev/.well-known/skills/index.json
  - https://21st.dev/.well-known/skills/21st-cli-use/SKILL.md
  - https://21st.dev/.well-known/skills/21st-ui-build/SKILL.md
  - https://21st.dev/.well-known/skills/21st-ui-review/SKILL.md
  - https://21st.dev/.well-known/skills/21st-ai/SKILL.md
- 21st blog, shadcn Tailwind v4 migration: https://21st.dev/blog/shadcn-tailwind-v4-migration
- Magic MCP → 21st MCP README: https://github.com/21st-dev/magic-mcp
- npm `@21st-dev/cli` (v1.17.1, README): https://www.npmjs.com/package/@21st-dev/cli
- npm `@21st-dev/magic` (v0.2.3 proxy): https://www.npmjs.com/package/@21st-dev/magic
- Component metadata pages (license and deps), e.g. https://21st.dev/@dillionverma/components/blur-fade.md, https://21st.dev/@shadcnblockscom/components/gallery4.md, and every URL in section 5
- Category indexes: https://21st.dev/community/components/s/hero.md (and carousel, gallery, image-gallery, parallax, scroll, text-animation, testimonials, background, product-card, cta, marquee, card, animated)
- shadcn Tailwind v4 notes: https://ui.shadcn.com/docs/tailwind-v4
- shadcn v3 installation ("If you are using Tailwind v3, use shadcn@2.3.0"): https://v3.shadcn.com/docs/installation/next
- shadcn components.json: https://ui.shadcn.com/docs/components-json
- shadcn RTL (January 2026): https://ui.shadcn.com/docs/rtl and https://ui.shadcn.com/docs/changelog/2026-01-rtl
- 21st Agents SDK (YC launch): https://www.ycombinator.com/launches/PiD-21st-infrastructure-for-ai-agents
- Third-party Claude Code + Magic guide (context only): https://mcp.harishgarg.com/use/21stdev-magic/mcp-server/with/claude-code
- Local project files inspected (read-only): `package.json`, `tailwind.config.ts`, `src/app/globals.css`, `src/lib/utils.ts`, `tsconfig.json`, `next.config.mjs`, `src/components/**` listing
