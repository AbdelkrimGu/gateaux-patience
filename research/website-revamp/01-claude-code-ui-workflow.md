# Claude Code UI workflow for the Gateaux Patience revamp

*Research date: 2026-10-04. Audience: Claude Code (and Johnny) before starting the revamp of the Gateaux Patience site (Next.js 14 App Router, TS, Tailwind 3.4, framer-motion 11, next-intl 3 FR/AR-RTL/EN, R3F 8 tiramisu preview, admin panel, Netlify).*

---

## TL;DR

1. **Install Anthropic's `frontend-design` skill first.** It is in the official plugin marketplace, which is already registered on this machine (`~/.claude/plugins/known_marketplaces.json`). Run `/plugin install frontend-design@claude-plugins-official`. The current version (fetched today) is more than a "don't use Inter" list. It sets a process: plan tokens, check them against the brief, build, then critique with screenshots. It also names the exact looks that read as AI-generated. **The first look it names is "warm cream background + high-contrast serif display + terracotta/clay accent". That is very close to our current site (`#FFF8F3` cream, Playfair Display, rose `#C9727A`, plus Inter for body).** The revamp has to either commit to that direction on purpose, with a specific reason, or move away from it.
2. **Close the visual loop.** Claude has to see what it builds. Install **Playwright MCP** (screenshots at desktop and mobile viewports, works in all 3 locales including RTL) and **Chrome DevTools MCP** (Lighthouse audits, performance traces, CSS inspection, device emulation). Optionally add **Claude in Chrome** (`/chrome`), which needs the user to install the extension. Anthropic's own best-practices doc says: *"take a screenshot of the result and compare it to the original. list differences and fix them."*
3. **Design system before code.** Write a `DESIGN.md` brief: subject, audience, one memorable idea, 4–6 named hex colors, type roles, layout sketches, motion budget, and RTL rules. Express it as Tailwind tokens plus a short CLAUDE.md section that points to it. Work section by section. Each section gets an implementer pass and then a reviewer pass that critiques screenshots, which matches the existing agent-pair methodology.
4. **Component libraries are inputs, not the design.** shadcn/ui (Radix) is the base for accessible primitives. Magic UI, Aceternity, React Bits and Motion Primitives are good for one effect each, but they are exactly where generic looks come from if overused. Most of them now target Tailwind v4 and React 19 by default. Tailwind v3 support survives only as "legacy" docs (Magic UI v3 site, shadcn v3 docs). coss ui (formerly Origin UI) requires Tailwind v4.
5. **Stack recommendation: upgrade before the revamp, in two small verified PRs.**
   - PR 1: Next 14 → 16.3, React 18 → 19, R3F 8 → 9 + drei 9 → 10, next-intl 3 → 4, `framer-motion` → `motion`.
   - PR 2: Tailwind 3.4 → 4.
   - The codebase is small enough to make this cheap: 38 `.tsx` files, three.js in 3 files, framer-motion in 2 files, and `params` is already typed as a `Promise` and awaited.
   - R3F 8 does not work on React 19, and Next 15+ App Router runs React 19. So the 3D tiramisu is the reason the framework upgrade has to happen as one unit.
   - Next 16.3 adds agent tooling: bundled version-matched docs + auto `AGENTS.md`, the `next-devtools-mcp` runtime error feed, and the `next-dev-loop` skill.
   - Gate both PRs with a Playwright screenshot baseline of every page × 3 locales, taken before and after.

---

## 1. Anthropic's frontend-aesthetics guidance

### 1.1 The problem: "distributional convergence"

Anthropic's post *Improving frontend design through Skills* (claude.com blog) explains why LLM UIs look alike. Models predict the statistically likely token, so with no direction they fall back on "safe" design choices: Inter or Roboto, purple gradients on white, evenly spread timid palettes, and card grids. Users call this "AI slop". A skill fixes it by loading specific design guidance only when frontend work is happening, so it costs no context the rest of the time.

The blog's original (2025) guidance, in short:

- **Typography:** avoid Inter, Roboto, Open Sans, Lato and system defaults. Pick a distinctive pairing (editorial examples: Playfair Display, Crimson Pro, Newsreader; distinctive examples: Bricolage Grotesque). Use high contrast and weight extremes (100/200 against 800/900, not 400 against 600).
- **Color and theme:** commit to one cohesive aesthetic in CSS variables. *"Dominant colors with sharp accents outperform timid, evenly-distributed palettes."*
- **Motion:** *"One well-orchestrated page load with staggered reveals … creates more delight than scattered micro-interactions."*
- **Backgrounds:** build atmosphere and depth (layered gradients, patterns, contextual effects) instead of flat solid colors.

### 1.2 The current `frontend-design` SKILL.md (verbatim source fetched today)

Source: `github.com/anthropics/skills/skills/frontend-design/SKILL.md`, identical to the copy in `anthropics/claude-plugins-official/plugins/frontend-design`. The skill has evolved since the blog post. Its principles now are:

**Framing.** *"Approach this as the design lead at a design studio known for giving every client a distinct visual identity … This client has already rejected proposals that felt cliché or templated."*

**Ground the design in the subject matter.** The subject's industry, materials and vernacular are where distinctive choices come from. For us that means pâtisserie: sugar work, ganache, crumb, layered cross-sections, piping, gold leaf, the atelier, the city's own visual culture (the repo already has `hero-zellige` and `hero-stories` experiments). Build with **real content** throughout.

**Hero first.** Open with "the most characteristic thing in the subject's world". That could be a headline, an image, an animation, a live demo or an interactive moment. For us the live demo option is the **tiramisu builder**, which is a strong hero candidate. The skill calls "big number + small label + stats + gradient accent" the default treatment.

**Typography:**
- Use one or two families, and if two, make them clearly distinct.
- Choose them deliberately and set a real type scale, following *The Elements of Typographic Style*.
- Treat headline type as an active design element.
- Keep lines under ~80 characters. Serif body text gets slightly more line-height.
- Avoid three "tells":
  - accenting one word in a headline (italic, bold or a different color);
  - ALL-CAPS labels;
  - unnecessary eyebrow labels.

**Structure is information.** Borders, dividers and numbering must encode meaning. Use "01 / 02 / 03" only for real sequences (for example: order steps, the tiramisu wizard).

**Motion.** Use non-user-triggered motion sparingly. *"A single orchestrated moment … lands better than scattered effects; fade-and-slide-up entrances on each section and hover transitions on every card are the generic default and read as AI-generated."* Motion that responds to user action (open, expand, confirm) is welcome.

**Calibration list of current AI defaults.** These are legitimate only when the brief chooses them:
1. **Warm cream background (≈ #F4F1EA) + high-contrast serif display + terracotta/clay accent (≈ #D97757)** ← our current site is close to this.
2. Near-black background with one acid-green or vermilion accent.
3. Broadsheet layout: hairline rules, zero radius, dense columns.
4. SaaS card kit: identical rounded cards, one radius everywhere, `rgba(0,0,0,.1)` shadows, gradient washes.
5. Template chrome: tracked-out ALL-CAPS eyebrows, `A · B · C` meta strings, `WORD — fragment` labels, #0B0B0B/#111 instead of black, monospace data labels, "→" appended to links.

**Process: two passes.**
1. Write a compact design plan: **4–6 named hex colors**, typefaces and their roles, a layout concept with **ASCII wireframes** and alignment rules, and a set of principles.
2. Review the plan against the brief. Any part that reads like the default you would produce for any similar page gets revised, and you say what changed and why. Only then write code. Watch for CSS specificity collisions, especially section padding fighting component padding.

**Restraint and self-critique.**
- *"Spend your boldness in one place."*
- Quality floor: responsive to mobile, visible keyboard focus, reduced motion respected, accessible contrast.
- *"Critique your own work as you build, taking screenshots … a picture is worth 1000 tokens."*
- Chanel's rule: remove one accessory.
- Keep notes on what has been tried.

**Writing is design content.** Copy is written from the user's perspective, in active voice. A CTA says exactly what happens ("Commander ce gâteau", not "Envoyer"). Use consistent vocabulary through a flow. Errors give direction and never apologise. Sentence case, no filler.

**What this means for Gateaux Patience.**
- Cream, serif and a warm accent is not banned for a pâtisserie, since the brief can legitimately choose it.
- It must be a choice backed by something specific, such as a signature color taken from the actual cakes or a typographic idea drawn from French pâtisserie signage.
- **Inter** for body text is the most generic choice on the page, and **Great Vibes** script plus a rose accent is the most predictable "cake shop" look.
- Arabic needs its own deliberate face. Cairo is acceptable but generic. Evaluate alternatives such as IBM Plex Sans Arabic, Noto Naskh/Kufi, Readex Pro, Alexandria, or a display face paired with a text face.

### 1.3 How to install it (verified against code.claude.com docs)

The official marketplace `claude-plugins-official` is auto-registered on first interactive start, and it is already present on this machine.

| Where | Command |
|---|---|
| In a Claude Code session (CLI) | `/plugin install frontend-design@claude-plugins-official` (this opens the details panel; choose a scope) |
| From a shell (user scope by default) | `claude plugin install frontend-design@claude-plugins-official` |
| Shared with the repo | `claude plugin install frontend-design@claude-plugins-official --scope project` (writes `enabledPlugins` to `.claude/settings.json`) |
| VS Code extension | type `/plugins` → Plugins tab → search "frontend-design" → Install |
| Manual skill copy (no plugin) | copy `SKILL.md` to `~/.claude/skills/frontend-design/SKILL.md` (personal) or `.claude/skills/frontend-design/SKILL.md` (project) |
| Cross-agent installer (vercel-labs/skills) | `npx skills add anthropics/skills --skill frontend-design -a claude-code` (the CLI's `--skill`/`-a` syntax is documented; this exact repo path is not tested) |

After installing, run `/reload-plugins` if prompted, and check that `/frontend-design:frontend-design` appears in the `/` menu. Skills auto-trigger from their description, but invoking it explicitly at the start of each design task is more reliable. Note that a same-named claude.ai-synced skill runs as `/anthropic-skills:…`, and local skills take precedence.

---

## 2. Visual feedback loops

Code-only iteration is the main reason agent UIs disappoint. Anthropic's best-practices page puts *"Give Claude a way to verify its work"* first, and its UI example is to paste a screenshot, implement it, screenshot the result, list the differences and fix them. Three tools are relevant here, and they complement each other.

### 2.1 Playwright MCP (Microsoft): the screenshot workhorse

- Drives Chromium, Firefox or WebKit through the accessibility tree. `browser_take_screenshot` supports `fullPage`, element-only shots and `filename`, which saves to disk for before/after comparison.
- Useful flags:
  - `--viewport-size 1440x900`
  - `--device "iPhone 15"` or `--mobile`
  - `--isolated` (in-memory profile, which lets parallel agents avoid profile-lock conflicts)
  - `--headless`
  - `--caps vision,devtools`
- Windows install. The docs give the generic form `claude mcp add playwright npx @playwright/mcp@latest`. On native Windows, the Claude Code docs recommend a `cmd /c` wrapper for `npx`:

```bash
# desktop instance (user scope = all projects)
claude mcp add --scope user --transport stdio playwright -- cmd /c npx -y @playwright/mcp@latest --viewport-size 1440x900
# optional second instance pinned to a phone, so mobile checks are one tool call away
claude mcp add --scope user --transport stdio playwright-mobile -- cmd /c npx -y @playwright/mcp@latest --device "iPhone 15" --isolated
```

- Alternative: **plugin form**, `claude plugin install playwright@claude-plugins-official`. It ships `npx @playwright/mcp@latest` with no Windows wrapper. If it fails to connect on Windows ("Connection closed"), use the `cmd /c` form above.
- Alternative: the **Playwright CLI + skills**. Microsoft now recommends this for coding agents because it is more token-efficient: no big tool schemas, and it does not dump accessibility trees into context.
  ```bash
  npm install -g @playwright/cli@latest
  playwright-cli install --skills
  ```
  Then use commands like `playwright-cli open http://localhost:3000/fr --headed` and `playwright-cli screenshot`. Good for a screenshot script, and it can sit alongside the MCP.
- **Repeatable pattern for this project:** keep a small script, `scripts/shots.mjs`, using `@playwright/test` or the CLI. It captures `/{fr,ar,en}` × `{home, galerie, tiramisu, contact}` × `{390×844, 768×1024, 1440×900}` into `research/website-revamp/shots/<label>/`. Claude runs it after each section and reads the PNGs with its Read tool, which renders images. The reviewer agent compares them against the brief and the previous baseline. This is cheaper and more deterministic than driving the MCP interactively for every shot.

### 2.2 Chrome DevTools MCP (Google): quality and performance

- Tools include `take_screenshot`, `take_snapshot`, `emulate` (device, network and CPU throttling), `resize_page`, `get_css_styles`, `list_console_messages`, `list_network_requests`, `performance_start_trace` / `performance_stop_trace` / `performance_analyze_insight` (LCP and CLS insights), and **`lighthouse_audit`**. That means no separate Lighthouse MCP is needed.
- Install:
  ```bash
  # CLI (Windows-safe wrapper)
  claude mcp add --scope user --transport stdio chrome-devtools -- cmd /c npx -y chrome-devtools-mcp@latest
  # documented generic form:  claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest
  # or as plugin (MCP + skills), from the official marketplace:
  claude plugin install chrome-devtools-mcp@claude-plugins-official
  # or from Google's own marketplace:
  /plugin marketplace add ChromeDevTools/chrome-devtools-mcp
  /plugin install chrome-devtools-mcp@chrome-devtools-plugins
  ```
  `--slim --headless` gives a minimal toolset. The Windows troubleshooting doc confirms the `cmd /c` fix for "MCP error -32000: Connection closed".
- Use it for the **performance gate** of the revamp: hero LCP image, font loading (Arabic and Latin), CLS from animations, and the cost of the 3D chunk. Use Lighthouse on mobile emulation as the pass/fail number.

### 2.3 Claude in Chrome (Anthropic)

- Run `claude --chrome`, or `/chrome` → "Enabled by default". In VS Code, type `@browser` or enable it via `/chrome`.
- It uses the user's real Chrome or Edge, with visible tabs, console reading, screenshots saved to disk and GIF recording.
- **Needs the user:** the Chrome Web Store extension (≥ 1.0.36), a direct Anthropic plan (Pro/Max/Team/Enterprise), and `/login` auth (not an API key).
- It increases context use when always on. Best for quick checks such as "open localhost:3000/ar and tell me if anything is mirrored wrong". Playwright is better for repeatable multi-viewport shots.

### 2.4 Next.js runtime view (after upgrading to Next 16+)

`next-devtools-mcp` connects to the built-in `/_next/mcp` endpoint. Its tools are `get_errors`, `get_logs`, `get_routes`, `get_page_metadata`, plus `get_compilation_issues` and `compile_route` (Turbopack only). Add it to the project `.mcp.json`:

```json
{ "mcpServers": { "next-devtools": { "command": "cmd", "args": ["/c", "npx", "-y", "next-devtools-mcp@latest"] } } }
```

(The docs show `"command": "npx"`; the `cmd /c` form is the Windows adaptation.) On Next 16.3+, `next dev` also auto-writes `AGENTS.md` and `CLAUDE.md` (`@AGENTS.md`) that point the agent at the docs bundled in `node_modules/next/dist/docs/`. It also forwards browser console errors to the terminal. The `next-dev-loop` skill (`npx skills add vercel/next.js --skill next-dev-loop`) packages the edit → verify-at-runtime loop on top of that.

---

## 3. Design-system-first workflow

### 3.1 What experienced people put in front of the agent before any code

1. **A design brief, `research/website-revamp/DESIGN.md`**, written in the skill's format:
   - **Subject, audience, job:** a home pâtissière taking custom orders. Visitors are parents planning birthdays, weddings and Eid. The page's job is to make people trust her taste and then order (WhatsApp, phone or form).
   - **The one memorable thing:** for example, the tiramisu builder as the hero, a cross-section reveal, or the zellige motif. Pick exactly one.
   - **Palette:** 4–6 named hex values, taken from photos of her actual cakes rather than "rose + gold".
   - **Type roles:** display, text and Arabic. Include the type scale, measure (line length) and line-height for Latin and Arabic separately. Arabic needs larger sizes and more leading.
   - **Layout:** ASCII wireframes per section, alignment rules, and RTL mirroring rules (which things flip and which don't: logos, numerals, product photos).
   - **Motion budget:** one orchestrated load moment, user-triggered motion only after that, and `prefers-reduced-motion` respected.
   - **Banned list:** the skill's five default looks, plus our own (Great Vibes everywhere, `rose` on every heading, identical rounded cards, fade-up on every section).
   - **References:** 3–5 real sites or screenshots with *what specifically* to take from each ("the way X crops product photography edge to edge", not "make it like X"). Put the images in the repo so Claude can Read them.
2. **Tokens in code.**
   - Tailwind v3: `theme.extend` in `tailwind.config.ts`.
   - Tailwind v4: CSS-first `@theme { --color-…; --font-…; }` in `globals.css`.
   - Name tokens semantically (`--color-ink`, `--color-crumb`, `--color-ganache`), not `rose-light`. Add logical-property utilities (`ms-*`, `me-*`, `ps-*`, `start-*`) for RTL.
3. **A short CLAUDE.md section** (project). Anthropic says to keep CLAUDE.md lean and move rarely-needed detail into skills or imports. For example:
   ```md
   ## UI work
   - Read @research/website-revamp/DESIGN.md before any UI change. Tokens only; no raw hex/px outside tailwind config.
   - Use logical properties (ms/me/ps/pe/start/end), never ml/mr/left/right, so AR (RTL) mirrors correctly.
   - After each UI change: run `node scripts/shots.mjs <label>` and Read the PNGs for fr+ar at 390 and 1440 before saying done.
   - Motion: `motion/react` only; one orchestrated page-load moment; respect prefers-reduced-motion.
   ```
4. **Optionally, a project skill** at `.claude/skills/gp-design-review/SKILL.md`. It holds the reviewer's checklist (skill principles + DESIGN.md + accessibility/RTL/perf gates) and is invoked by the reviewer agent. This fits the existing implementer/critical-reviewer agent pairs in `.claude/agents/`.

### 3.2 Component libraries: quality and Tailwind compatibility

| Library | What it is | Quality notes | Tailwind 3.4 + React 18 (today) | After upgrade (TW4 + React 19) |
|---|---|---|---|---|
| **shadcn/ui** (Radix or Base UI) | Copy-in accessible primitives (dialog, sheet, select, form…) | De-facto standard. Unstyled enough to restyle with our tokens. Use it for admin and order-form primitives | Works. *"Existing apps with Tailwind v3 and React 18 will still work… new components will still be in v3 and React 18 until you upgrade."* Legacy docs exist for v3 | Default target |
| **Magic UI** | 150+ animated effects (marquee, text reveals, borders, particles) | Polished, but its effects are recognisably "SaaS landing". Use one at most | Legacy at `v3.magicui.design` | Default (v4 + React 19) |
| **Aceternity UI** | Flashy hero/scroll effects (spotlight, parallax, 3D cards) | High wow, but the most likely to look AI-generated. Borrow techniques, don't drop it in | Claims both v3 (JS config) and v4 work. Uses the `motion` package | Works |
| **React Bits** | 110+ animated text, background and UI components in 4 variants (JS/TS × CSS/Tailwind), installable via shadcn or jsrepo | Good variety. The CSS variants avoid Tailwind-version issues completely | CSS variants work anywhere. TW variants are mostly plain utilities | Works |
| **Motion Primitives** | Small motion building blocks (text effects, transitions, morphing dialog) on Motion | Tasteful and minimal; closest to "design engineer" quality | Built for TW4 (some utilities may need adjusting); unverified | Native |
| **coss ui** (formerly Origin UI) | Big set of shadcn-style variants on Base UI | High quality | **Requires Tailwind v4** + `@base-ui/react` | Works |
| **Animata** | Copy-paste animated components | Uneven quality | Historically TW3-based; unverified | Probably fine |

**Recommendation:**
- Use shadcn/ui primitives, restyled with our tokens, for structure and accessibility. This matters especially for the order form, dialogs and the admin panel.
- Hand-build the 1–2 signature moments with `motion/react` and CSS rather than importing effect components.
- Use effect libraries as **reference implementations** to read and adapt, not as the look.
- The shadcn MCP (below) can browse and install from any shadcn-compatible registry (`@magicui`, `@aceternity`, `@react-bits`…) once `components.json` exists.

---

## 4. Other useful MCPs, skills and plugins

| Tool | Why | Notes |
|---|---|---|
| **context7** (Upstash) | Up-to-date docs for Tailwind v4, Motion, next-intl 4, R3F 9, which postdate training or move fast | Plugin: `claude plugin install context7@claude-plugins-official` (remote `https://mcp.context7.com/mcp`). Or `npx ctx7 setup --claude` (OAuth, picks CLI+skill or MCP). Or `claude mcp add --scope user --transport http context7 https://mcp.context7.com/mcp --header "Authorization: Bearer <KEY>"`. API key is free and optional, but recommended for rate limits |
| **shadcn MCP** | Browse, search and install components from shadcn and third-party registries in natural language | `npx shadcn@latest mcp init --client claude` → writes project `.mcp.json` (`npx shadcn@latest mcp`). Only useful after `npx shadcn@latest init` creates `components.json`. Project-scoped servers ask for approval on first use |
| **vercel-labs/agent-skills** | `web-design-guidelines` (100+ UI rules: a11y, focus, forms, animation, typography, images, i18n, touch) and `react-best-practices` (40+ perf rules) | `npx skills add vercel-labs/agent-skills --skill web-design-guidelines --skill react-best-practices -a claude-code` (add `-g` for global). Good as the reviewer's audit list |
| **Next.js skills + next-devtools-mcp** | Runtime errors, routes, version-matched docs | Next ≥ 16 required (16.3 for auto AGENTS.md). See §2.4 |
| **Figma MCP** | Only if a designer hands over Figma files | Remote: `claude mcp add --transport http figma https://mcp.figma.com/mcp` or `claude plugin install figma@claude-plugins-official`. Needs a Figma account (OAuth); Dev Mode seat for full features |
| **Claude Design** (Anthropic Labs, research preview since Apr 2026) | Visual canvas for prototyping. Builds a design system from the codebase and hands a "handoff bundle" to Claude Code | A claude.ai product (Pro/Max/Team/Enterprise), not an MCP. Useful for the user to explore 2–3 art directions before coding |
| **modern-web-guidance** (Google Chrome) | Keeps the agent current on modern CSS and web platform features (view transitions, container queries, `@property`) | `claude plugin install modern-web-guidance@claude-plugins-official` |
| **netlify-skills** | Netlify specifics: Image CDN, forms, caching, deploy | `claude plugin install netlify-skills@claude-plugins-official`. The site is on Netlify |
| **typescript-lsp** | Precise symbol navigation and diagnostics after edits | `claude plugin install typescript-lsp@claude-plugins-official` (needs `typescript-language-server` on PATH; check the plugin README) |
| **Superdesign** | Canvas for branchable design drafts from the codebase | `claude plugin install superdesign@claude-plugins-official`. Third-party account |
| Image optimisation | `sharp` is already a dependency. `next/image` + Netlify Image CDN cover most needs | A Cloudinary plugin exists in the marketplace, but it is not needed with S3 + next/image |

---

## 5. Prompting patterns that produce better UI

These combine Anthropic's docs and skill with reports from practitioners. They are listed roughly in order of impact.

1. **Brief before build, and have Claude interview the user.** *"I want to revamp X. Interview me using AskUserQuestion about audience, art direction, the one memorable thing, constraints. Then write DESIGN.md."* Then start a **fresh session** to implement (Anthropic best practice: spec in one session, implement in a clean one).
2. **Invoke the skill explicitly and ask for the two-pass plan.** *"Use the frontend-design skill. Propose 3 distinct art directions for a trilingual (FR/AR/EN) home pâtisserie as token plans (palette, type, ASCII layout of the hero). For each, say which generic default it risks and how it avoids it. Don't write code."* Pick one, then refine it.
3. **Be concrete about art direction, never adjectives.** "Elegant and modern" produces the median. Say things like "editorial food-magazine layout, full-bleed macro photography of cross-sections, one serif display at 120px+ with tight tracking, body at 18px/1.6, no cards". Name the reference sites *and the specific attribute to borrow* from each.
4. **Work section by section with a screenshot gate.**
   - Hero → story → gallery → tiramisu builder → order/contact → footer.
   - For each: implement, run the screenshot script (FR + AR, 390 and 1440), Read the images, list the differences against DESIGN.md, fix them.
   - Require **evidence**: screenshots and Lighthouse numbers, not "looks good".
5. **A separate reviewer critiques screenshots, not code.** A subagent or second session with a fresh context gets only the screenshots + DESIGN.md + the skill's default-look list. It answers: "What reads as generic? What is the one memorable thing? Remove one accessory." Tell it to report only issues that affect the brief, accessibility or performance, to avoid endless polishing (Anthropic warns that reviewers always find *something*).
6. **Paste images.** Mood-board images, the client's cake photos, competitor screenshots. Claude reads PNG/JPG directly ("a picture is worth 1000 tokens").
7. **Real content only.** Real cake names, prices policy, FR/AR/EN copy and real photos from S3. Lorem ipsum produces template-looking layouts.
8. **Constrain the decoration budget.** For example: "max one animated effect per page; no gradient text; no glassmorphism; no eyebrow labels; radius scale has 2 values". Constraints reliably pull the output away from the median.
9. **Ask for alternatives in parallel when stuck.** Use git worktrees or parallel agents to build 2–3 hero variants and compare the screenshots side by side, instead of iterating one variant forever.
10. **Reset instead of correcting repeatedly.** After two failed corrections, `/clear` and rewrite the prompt with what you learned (Anthropic best practice).
11. **Make the checks deterministic.** A Stop hook or `/goal` that runs `npm run build` + the screenshot script, so Claude cannot finish a UI turn without producing evidence.

---

## 6. Stack upgrade recommendation

### 6.1 Facts (npm registry, 2026-10-04)

| Package | Current in repo | Latest | Notes |
|---|---|---|---|
| next | 14.2.29 | **16.3.8** | Next 16: Node ≥ 20.9 (we have 24.19), Turbopack default, `middleware.ts` → `proxy.ts`, sync `params` removed (**we already await `params`**), `next lint` removed, image default changes (`qualities: [75]`, `minimumCacheTTL` 4h), browsers Safari 16.4+/Chrome 111+ |
| react / react-dom | 18.3.1 | **19.3.0** | Next 15+/16 App Router runs React 19 (canary) regardless of the installed version |
| @react-three/fiber | 8.17 | **9.8.1** | peer `react >=19 <19.4`. **R3F 8 breaks on React 19** (`ReactCurrentOwner` error). R3F 9 is required |
| @react-three/drei | 9.114 | **10.7.9** | peer React 19 + fiber 9 |
| three | 0.169 | 0.186 | Optional bump; check `TiramisuScene3D` materials and textures |
| next-intl | 3.22 | **4.14.9** | Supports Next 12–16 and React 16–19. v4 changes: `getRequestConfig` must return `locale`, `NextIntlClientProvider` required (we already have it), file rename to `proxy.ts` on Next 16 |
| framer-motion | 11.18 | 14.0 (`motion` 14.0) | `motion/react` supports React 18 *and* 19. v12 and v14 have no breaking changes for React; v13 only touches emotion/styled-components. Only **2 files** import it |
| tailwindcss | 3.4.14 | **4.3.3** | Needs Safari 16.4+/Chrome 111+/Firefox 128+. Upgrade tool `npx @tailwindcss/upgrade` (Node 20+). Renames: `shadow-sm`→`shadow-xs`, `shadow`→`shadow-sm`, `rounded-sm`→`rounded-xs`, `outline-none`→`outline-hidden`, `ring` 3px→1px, default border color → `currentColor`, `!flex`→`flex!`, `bg-[--x]`→`bg-(--x)` |
| others | — | — | react-image-gallery, react-zoom-pan-pinch, embla, dnd-kit, react-hook-form, sonner, lucide and react-intersection-observer all declare React 19 support |

Netlify supports Next.js 16 with zero configuration (Netlify changelog, Oct 2025).

### 6.2 Options

| Option | Pros | Cons |
|---|---|---|
| **A. Stay** on Next 14 / React 18 / TW3, revamp only | No migration risk | Every modern registry (shadcn new style, Magic UI, coss, Motion Primitives) defaults to TW4/React 19, so we would keep translating. No `next-devtools-mcp`, bundled docs or `next-dev-loop`. The revamp rewrites most class names anyway, so we would be investing in a dead-end config |
| **B. Partial:** `framer-motion` → `motion` + Tailwind v4 only (stay Next 14 / React 18) | Gets the TW4 ecosystem; R3F 8 untouched | Next 14 + TW4 works via `@tailwindcss/postcss`, but this keeps old Next and misses the agent tooling. Half a migration |
| **C. Full, staged (recommended)** | Modern ecosystem, agent tooling (AGENTS.md + bundled docs, next-devtools-mcp, next-dev-loop, View Transitions in React 19.2), one-time cost on a small codebase | Needs careful verification of the 3D preview (R3F 9 API changes) and the admin panel. Tailwind v4 raises the browser floor |

### 6.3 Recommended path

Each step is its own branch and PR, verified before the next one starts.

0. **Baseline.** Before any change, capture screenshots of every public page × FR/AR/EN × 390/1440, plus admin pages. Also record Lighthouse mobile scores. Commit them to `research/website-revamp/shots/baseline/`.
1. **Framework PR: Next 16 + React 19 + R3F 9 + drei 10 + next-intl 4 + motion.**
   - `npx @next/codemod@canary upgrade latest`. This handles `middleware`→`proxy`, `next lint`→ESLint CLI and Turbopack config. Check that the next-intl `createMiddleware` still works when exported from `proxy.ts`.
   - `npm i react@latest react-dom@latest @types/react@latest @types/react-dom@latest @react-three/fiber@^9 @react-three/drei@^10 next-intl@^4 motion`. Then `npm rm framer-motion` and rewrite the 2 imports to `motion/react`.
   - Follow the R3F v9 migration guide for `TiramisuScene3D.tsx`, `geometry.ts` and `useTiramisuTextures.ts`. Use the existing `tiramisu-3d-implementer` / `tiramisu-3d-reviewer` agent pair for this step.
   - Check the `next/image` changes. Add `images.qualities` if any `quality=` prop is not 75.
   - Gate: `npm run build` passes, the screenshot diff against baseline shows no unintended change, the 3D preview works on mobile, and the admin CRUD and upload paths work.
   - Then let `next dev` write `AGENTS.md`/`CLAUDE.md` (16.3+) and add `next-devtools-mcp`.
2. **Tailwind v4 PR.**
   - `npx @tailwindcss/upgrade`. Move tokens to `@theme` in `globals.css`. Review renamed utilities and default border/ring colors.
   - Gate: zero visual diff against the step-1 shots.
   - *If the user's analytics show meaningful traffic on iOS < 16.4 or very old Android WebViews, defer this step.* Tailwind 3.4 can carry the revamp; we would just use the v3 legacy docs of shadcn and Magic UI.
3. **Design-system PR.** `npx shadcn@latest init` (on TW4 + React 19), then the shadcn MCP. Write DESIGN.md, tokens and the CLAUDE.md UI section.
4. **Revamp, section by section,** with the screenshot and reviewer loop from §5.

Why not fold the upgrade into the revamp? Mixing a framework migration with a visual redesign makes regressions impossible to attribute. The baseline screenshots only work as a regression check if the look is supposed to stay constant during steps 1–2.

---

## Toolkit to install

Commands are for the Windows CLI. The VS Code extension shares the same settings and plugins. "User" means something only the human can do: an account, an API key, a browser extension, or approving a prompt.

| # | Tool | Command(s) | Scope | Needs the user? | Priority |
|---|---|---|---|---|---|
| 1 | frontend-design skill (Anthropic) | `claude plugin install frontend-design@claude-plugins-official` (or `/plugin install frontend-design@claude-plugins-official`) | user or `--scope project` | Approve install only | **Must** |
| 2 | Playwright MCP (desktop) | `claude mcp add --scope user --transport stdio playwright -- cmd /c npx -y @playwright/mcp@latest --viewport-size 1440x900` | user | Approve tool use. Chrome must be installed (or add `--browser msedge`) | **Must** |
| 2b | Playwright MCP (mobile) | `claude mcp add --scope user --transport stdio playwright-mobile -- cmd /c npx -y @playwright/mcp@latest --device "iPhone 15" --isolated` | user | — | Should |
| 2c | Playwright CLI + skills (token-light alternative) | `npm install -g @playwright/cli@latest` then `playwright-cli install --skills` | global | Approve global npm install | Optional |
| 3 | Chrome DevTools MCP (Lighthouse, perf traces, CSS) | `claude mcp add --scope user --transport stdio chrome-devtools -- cmd /c npx -y chrome-devtools-mcp@latest` (or `claude plugin install chrome-devtools-mcp@claude-plugins-official`) | user | Chrome installed | **Must** |
| 4 | context7 (current docs) | `claude plugin install context7@claude-plugins-official`, or `npx ctx7 setup --claude` | user | Optional free API key / OAuth (ctx7 setup) | Should |
| 5 | vercel-labs skills (UI audit + React perf) | `npx skills add vercel-labs/agent-skills --skill web-design-guidelines --skill react-best-practices -a claude-code` | project (add `-g` for global) | — | Should |
| 6 | Claude in Chrome | `claude --chrome`, or `/chrome` → Enabled by default; VS Code: `@browser` | user | **Yes**: install the Chrome extension, Pro/Max plan, `/login` | Optional |
| 7 | shadcn MCP | after `npx shadcn@latest init`: `npx shadcn@latest mcp init --client claude` | project (`.mcp.json`) | Approve project MCP on first use | After stack step 3 |
| 8 | next-devtools-mcp | add to `.mcp.json`: `{"next-devtools":{"command":"cmd","args":["/c","npx","-y","next-devtools-mcp@latest"]}}` | project | Approve project MCP | After Next 16 |
| 9 | next-dev-loop skill | `npx skills add vercel/next.js --skill next-dev-loop` | project | — | After Next 16.3 |
| 10 | modern-web-guidance | `claude plugin install modern-web-guidance@claude-plugins-official` | user | — | Optional |
| 11 | netlify-skills | `claude plugin install netlify-skills@claude-plugins-official` | project | Netlify CLI auth only if deploying from the agent | Optional |
| 12 | Figma MCP | `claude mcp add --transport http figma https://mcp.figma.com/mcp` | user | **Yes**: Figma account (OAuth) | Only if Figma files exist |
| 13 | Claude Design | claude.ai → Claude Design (research preview) | — | **Yes**: run by the user in claude.ai | Optional, for exploring directions |

After installing: run `claude mcp list`, `/mcp`, `/plugin` (Installed tab) and `/skills` to verify. Watch context cost: each MCP's tool schemas load every turn. Disable the ones not needed for the current phase, and check plugin cost with `claude plugin details <name>`.

---

## Sources

**Anthropic (primary)**
- frontend-design SKILL.md: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- Official plugin marketplace (frontend-design, playwright, context7, chrome-devtools-mcp, figma, …): https://github.com/anthropics/claude-plugins-official
- Blog, *Improving frontend design through Skills*: https://www.claude.com/blog/improving-frontend-design-through-skills
- Claude Code best practices: https://code.claude.com/docs/en/best-practices
- Install and manage plugins: https://code.claude.com/docs/en/discover-plugins
- Skills: https://code.claude.com/docs/en/skills
- MCP (`claude mcp add`, scopes, Windows `cmd /c`, output limits): https://code.claude.com/docs/en/mcp
- Claude Code with Chrome: https://code.claude.com/docs/en/chrome
- Introducing Claude Design: https://www.anthropic.com/news/claude-design-anthropic-labs

**Browser tooling**
- Playwright MCP: https://github.com/microsoft/playwright-mcp
- Playwright CLI + skills: https://github.com/microsoft/playwright-cli
- Chrome DevTools MCP: https://github.com/ChromeDevTools/chrome-devtools-mcp (docs/client-configurations.md, docs/tool-reference.md, docs/troubleshooting.md)

**Next.js / Vercel**
- Upgrading to v16: https://nextjs.org/docs/app/guides/upgrading/version-16
- AI coding agents guide: https://nextjs.org/docs/app/guides/ai-agents
- Next.js MCP server: https://nextjs.org/docs/app/guides/mcp
- vercel-labs/agent-skills: https://github.com/vercel-labs/agent-skills
- skills CLI: https://github.com/vercel-labs/skills
- Netlify Next 16 support: https://www.netlify.com/changelog/next-js-16-deploy-on-netlify/

**UI libraries and docs**
- shadcn MCP: https://ui.shadcn.com/docs/mcp
- shadcn Tailwind v4: https://ui.shadcn.com/docs/tailwind-v4
- Magic UI legacy (v3): https://magicui.design/docs/legacy , https://v3.magicui.design
- Aceternity Tailwind install: https://ui.aceternity.com/docs/install-tailwindcss
- React Bits: https://reactbits.dev
- coss ui (formerly Origin UI): https://coss.com/ui
- Tailwind v4 upgrade guide: https://tailwindcss.com/docs/upgrade-guide
- Motion upgrade guide: https://motion.dev/docs/react-upgrade-guide
- next-intl 4.0: https://next-intl.dev/blog/next-intl-4-0
- R3F v8 + React 19 incompatibility: https://github.com/pmndrs/react-three-fiber/issues/3398
- context7: https://github.com/upstash/context7
- Figma MCP guide: https://github.com/figma/mcp-server-guide

---

## Confidence / unverified

**High confidence (read from primary sources today):**
- The frontend-design SKILL.md text and its "AI default looks" list.
- Plugin names in `claude-plugins-official`.
- `claude plugin install` / `/plugin install` syntax and scopes.
- `claude mcp add` syntax, including `cmd /c` on Windows.
- Playwright MCP flags and the Microsoft recommendation of the CLI for coding agents.
- The Chrome DevTools MCP tool list (includes `lighthouse_audit`).
- Next 16 breaking changes and agent tooling.
- npm latest versions and peer dependencies (R3F 9 requires React ≥ 19; drei 10 requires fiber 9; motion and next-intl accept React 18 and 19).
- Tailwind v4 browser floor and renames.

**Medium confidence:**
- Exact `cmd /c` necessity. Claude Code on recent Windows builds may launch `npx` directly; the wrapper is the documented safe fallback.
- The official `playwright` plugin's raw `npx` config working on Windows without the wrapper (not tested).
- `npx skills add anthropics/skills --skill frontend-design` resolving correctly (the CLI syntax is documented; this exact repo path is not tested).
- `npx ctx7 setup --claude` flag behavior.

**Unverified / secondary sources only:**
- Aceternity's claim of v3 support.
- Motion Primitives' and Animata's Tailwind-version requirements.
- React Bits component count (sources say 110–165+).
- Next-intl 4 + Next 16 `proxy.ts` details (from a third-party blog plus the next-intl 4.0 post).
- Netlify adapter specifics for 16.2+ Adapter API (secondary).

**Not tested at all:**
- Nothing was installed or run against this repo, per instructions. The R3F 8 → 9 migration effort for `TiramisuScene3D` was not estimated beyond the file count (3 files).
- The current target-audience browser mix, which decides the Tailwind v4 risk, is unknown. Check Netlify or Google Analytics before step 2.

**Judgement calls (opinion, not fact):**
- "Upgrade before revamp" in two PRs.
- "Use effect libraries as references, not the look."
- "The tiramisu builder is a strong hero candidate."
- Treating the current cream/serif/rose palette as needing deliberate justification. This follows directly from the skill's calibration list, but the client may legitimately want it.
