# Shared UI: catalogue for the page agents

Wave 2a foundations for "Écrit en sucre" (`DESIGN.md` + `design/direction-b/DESIGN.md`).
Live demo: `/ui-kit` (dev server, or `GP_UI_KIT=1 npx next start -p 3123`; 404 otherwise).

## Ground rules (read before building a page)

| Rule | Why |
|---|---|
| **Don't edit shared files**: `globals.css`, `legacy.css`, `[locale]/layout.tsx`, `(site)/layout.tsx`, `src/components/{ui,layout}/*`, `src/lib/{whatsapp,piping,cake-ref,business,revalidate}.ts`, `src/i18n/*`, `messages/*/common.json`, `messages/*/whatsapp.json`, `messages/*/meta.json`. | Three agents work in parallel worktrees. If a shared piece is wrong or missing, put a local version in your own folder and flag it in your report. |
| **Your files:** home → `src/components/home/*`, `(site)/page.tsx`, `messages/*/home.json`. Gallery + detail → `src/components/gallery/*`, `(site)/galerie/**`, `messages/*/gallery.json`, `messages/*/cake.json`. Tiramisu → `src/components/tiramisu/*` (skin only), `tiramisu/page.tsx`, `messages/*/tiramisuUi.json`. | No two agents touch the same file. |
| Page metadata strings go in your own namespace (e.g. `home.meta_title`), not in `meta.json`. | `meta.json` is shared. |
| **Translate on the server, pass strings as props.** There is no global `NextIntlClientProvider` (use-intl on the client costs ~12 KB gz). If a client island really needs `useTranslations`, wrap it: `<IntlIsland namespaces={["home"]}>…</IntlIsland>` (it always adds `common`). | JS budget. |
| **No global MotionProvider.** CSS first. If an island needs `m.*`, wrap that island in `<MotionProvider>` and import `m` from `motion/react`. Never `motion.*`, never framer-motion, never lucide in public UI. | Motion core is ~11 KB gz before any feature. |
| Links: `LocaleLink` (from `@/i18n/LocaleLink`) or `<Button href="/x">`. Never `@/i18n/navigation` (adds the next-intl navigation runtime). | JS budget. |
| `(site)/layout.tsx` already renders skip link + `<Header>` + `<main id="main">` + `<Footer>`. Pages return sections, not `<main>`, and render their own `<StickyOrderBar>`. | One landmark set. |
| The home steps band (écrin) must have `id="commander"`: the header links to `/#commander`. | Nav target. |
| Keep pages static/ISR: `export const revalidate = 300` and `setRequestLocale(locale)`. Don't read `searchParams` in a page (makes it dynamic); read `?c=` on the client inside `<Suspense>`. | LCP, Netlify cache. |
| Old code to replace wholesale: `src/components/home/*`, `GalleryClient`, `CakeDetailClient`. They still use `legacy.css` classes; don't copy those classes into new code. | `legacy.css` is deleted after Wave 2b. |
| Logical utilities only (`ms-/me-/ps-/pe-/start-/end-/text-start`), never `left/right/ml/mr/pl/pr`. No `isRTL ? 'flex-row-reverse'`. | RTL is first-class. |
| `npm run check:i18n` and `npm test` must pass; every string in `messages/{fr,ar,en}`. | Parity. |

## Tokens (Tailwind 4 utilities from `globals.css`)

- Colours: `sucre`, `paillette`, `framboise` (`framboise-deep` hover), `dragee`, `cuivre` (on dark only), `cacao`, `mascarpone`, `ink`, `ink-soft`, `ink-muted`, `hairline`; piping `p-{bleu,lilas,menthe,rouge,or}` / tints `t-*`; semantic `background`, `foreground`, `primary`, `muted`, `accent`, `border`, `ring`.
- Per-cake colour: `style={pipingStyle(name)}` or class `piping-lilas`, then `text-piping`, `bg-tint`.
- Type: `type-h1`, `type-h2`, `type-band`, `type-card`, `type-lead`, `type-meta` (Arabic sizes/line-heights built in). `font-display`, `font-sans`.
- Layout: `wrap` (gutter 16 → 48 at 900px, max 1240), `bleed`, breakpoint variant `desk:` (≥900px), `--gutter`, `--header-h`.
- Shapes: `rounded-pill`, `rounded-plate`, `rounded-tin`, `rounded-band`.
- Motion: vars `--d-fast` 160ms, `--d-base` 280ms, `--d-pipe` 1400ms; `ease-pipe`, `ease-out`; `press` (scale .97). Wrap any signature motion in `@media (prefers-reduced-motion: no-preference)`; a global reduce guard exists.
- Surfaces: `sequin`, `bezel`, `photo-grade`, `flip-rtl`, `ltr` (bidi isolate for refs/phones).
- Page-specific CSS: a CSS module wrapped in `@layer components { … }` (unlayered CSS beats every Tailwind utility).

## Components (`src/components/ui`)

| Component | Use |
|---|---|
| `Wordmark`, `CrownMark`, `WordmarkText` | `<Wordmark layout="stacked" />` / `"inline"`. Always LTR, never mirrored. |
| `Icon` | `<Icon name="chevron" size={20} label?="…" />`. Names: menu, close, chevron, arrow, back, calendar, guests, gift, pin, instagram, facebook, check, phone, whatsapp. chevron/arrow/back mirror in RTL. |
| `Button`, `buttonClasses()` | `<Button href={waUrl} icon="whatsapp">{t("order.cta")}</Button>`, `<Button href="/galerie" variant="ghost" iconEnd="chevron">`, `variant="on-dark"` on écrin, `size="lg"/"md"/"sm"`, `block`. Internal `href` → LocaleLink, `https://` → new tab, no href → `<button>`. |
| `LetteredBoard`, `RefTag`, `ringLayout()` | `<LetteredBoard lang={locale} message={t("common.occasion.birthday")} name={name} tone="sucre" image={{ src, alt, priority: true }} tag={<RefTag refCode={ref} label={…} />} caption="…" className="w-[min(58vw,300px)] desk:w-[380px]" style={pipingStyle(p)} />`. Hook-free (server or client). `tone="ecrin"` for weddings (copper ring, Dela 20% smaller). `animate="pipe"` default; changing `pipeKey` (default message+name) replays: debounce it when typing. Ring auto-shrinks long text. `priority` only on the page's LCP image; the image is never opacity-gated. |
| `NameField`, `NAME_MAX` | Client, controlled: `<NameField value={name} onChange={setName} label={…} placeholder={…} onSubmit?={…} />`. Labels from `common.name_field.*`, translated by the server parent. Max 14. |
| `CakeCard`, `cakeTransitionName()` | `<CakeCard cake={cake} locale={locale} eager? transitionName? meta? as="h2" />`. Whole card is one link to `/galerie/<slug>`; title = DB title; colour from `pipingFor(cake)`; ref under the title. `transitionName` sets `view-transition-name: cake-<slug>` on the mat: give the detail plate the same name. Names must be unique on a page. |
| `Chip`, `chipClasses()` | `<Chip href="/galerie?c=wedding" selected count={4} dot="or">Mariage</Chip>` (link, `scroll={false}`) or `<Chip selected onClick>` (toggle). Row: `flex gap-2 overflow-x-auto snap-x`. |
| `EcrinSurface`, `Bezel` | `<EcrinSurface as="section" aria-labelledby="h">…</EcrinSurface>`: only for the steps band, weddings, the tiramisu stage and the footer. `<Bezel>` = 1px copper frame for photos on écrin. Focus ring turns dragée inside. |

## Layout (`src/components/layout`)

| Component | Use |
|---|---|
| `SiteChrome` | Already used by `(site)/layout.tsx` and the 404. |
| `Header` | Server. Optional `orderHref`. Desktop links: Créations, Tiramisu, Mariages (`/galerie?c=wedding`), Comment commander (`/#commander`). |
| `Footer` | Server, écrin, reserves room for the sticky bar on phones. |
| `StickyOrderBar` | Server: `<StickyOrderBar waHref={buildWhatsAppUrl({ locale, kind: "cake", cake, page })} reveal="scroll"? label? />`. Inside a client island use `StickyOrderBarView` with all labels as props. Hidden ≥900px. `reveal="scroll"` (home) slides in at 420–520px of scroll. |
| `IntlIsland` | Server: `<IntlIsland namespaces={["gallery"]}>` around a client subtree that calls `useTranslations`. |
| `MotionProvider` | Client: `LazyMotion` (domAnimation, loaded async) + `MotionConfig reducedMotion="user"`, per island. |

## Libraries (`src/lib`)

| Module | API |
|---|---|
| `whatsapp.ts` | `buildWhatsAppUrl({ locale, kind: "general" \| "cake" \| "tiramisu" \| "sweets", cake?: { title, ref }, name?, date?: "yyyy-mm-dd", guests?, page?: "/galerie/x", extra?: string[] })`, `buildWhatsAppMessage()`, `WHATSAPP_CHAT_URL`. Templates: `messages/*/whatsapp.json`. Date and guests are always asked. Pass an unprefixed `page`: the locale prefix is added. The page URL is never bidi-isolated. **Occasion** (kind `"general"` only): `occasion?: "wedding" \| "birthday" \| "birth" \| "success"` or `category?: string \| null` (a gallery `?c=` slug, mapped with `occasionOfCategory()`; unknown slugs and `"all"` keep the generic sentence). E.g. the `?c=wedding` gallery: `buildWhatsAppUrl({ locale, kind: "general", category: "wedding", page: "/galerie?c=wedding" })` → « …un gâteau pour un mariage ou des fiançailles. ». |
| `cake-ref.ts` | `cakeRef(cake.id)` → `"GP-3K7Q"` (alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ`: no 0/O/1/I/L); `assertUniqueRefs(cakes)`. In RTL render it in `<bdi className="ltr">`. |
| `piping.ts` | `pipingFor(cake)` → `"bleu" \| "lilas" \| "menthe" \| "rouge" \| "or"` (weddings `or`), `PIPING`, `pipingStyle()`, `isWedding(slug)`, `occasionFor(categorySlug)` → `common.occasion.<key>`. |
| `business.ts` | `LEAD_TIME_DAYS`, `PRICE_FROM`, `DELIVERY`, `PAYMENT`, `DEPOSIT`: all `null`. Render a fact only when non-null. Never invent one. |
| `revalidate.ts` | `PUBLIC_REVALIDATE` (300), `CATALOG_TAG`, `revalidatePublicCatalog()` (already called by the admin save/delete routes). |
| `/api/orders` | POST JSON `{ name, phone, message?, cakeId?, cakeTitle? }`. **Honeypot:** add a visually hidden, `tabIndex={-1}`, `autoComplete="off"`, `aria-hidden` text input named **`website`** and send its value as `website`; a non-empty value gets a fake `202 { ok: true }` and nothing is stored. Rate limit: 5 requests/min per IP (`429` + `Retry-After`). |
| `admin-auth.ts` | `isAdmin()` / `requireAdmin()` for admin pages and API routes (signed HttpOnly cookie). Admin only. |
| `constants.ts` | `CONTACT`, `PHONE_E164`, `PHONE_LOCAL`, `SITE_URL`. |
| `@/i18n/paths` | `localizePath(locale, href)`, `stripLocale(pathname)`, `switchLocaleHref(locale, path)`. |
| `@/i18n/locale` | `asLocale(param)`, `isRtl(locale)`. |

## Messages

One file per namespace: `messages/<locale>/<namespace>.json`, typed against the French files (`t("…")` keys are checked by `tsc`). Shared: `common` (nav, lang, order, name_field, occasion, footer, not_found), `whatsapp`. Yours: `home`, `gallery`, `cake`, `tiramisuUi` (already wired in `src/i18n/messages.ts`; don't add new namespace files). Run `npm run check:i18n`.

## Budgets

JS on the wire, initial (`npm run measure:js -- --routes /x`): the framework (React + Next router) is ~146 KB gz; the shared chrome adds ~9 KB, so `/ui-kit` is 157 KB. That leaves ~13 KB for page code to stay within the 170 KB target. No R3F/three outside `/tiramisu`.
