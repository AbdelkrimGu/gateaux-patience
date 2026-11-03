import { galleryHref, type HomeCake, type HomeCategory, type HomeData } from "@/lib/home-data";

/**
 * "Soirée royale" line-up: turns the home data into the photo plan of the
 * page. A shared pool hands out photos so the same cake does not keep coming
 * back (adaptation.md); licensed / brand photos (`sensitive`) never reach a
 * first-impression slot, and personal photos (a child's face) never appear.
 * Curated picks (HERO_PICKS, OCCASION_PICKS…) override the database where its
 * categories are wrong or a photo carries lettering; missing picks fall back
 * to the pool, so new catalogues keep working.
 */

export interface V2Photo {
  src: string;
  /** Cake title in the current locale. */
  alt: string;
  slug: string;
  /** Cake page. */
  href: string;
  categorySlug: string;
  sensitive: boolean;
}

export interface HeroCard extends V2Photo {
  /** Full category label (accessible name). */
  label: string;
  /** Short label printed on the card ("Enfants", "Mariage"…). */
  shortLabel: string;
  /** Gallery filtered by the card's category. */
  galleryHref: string;
}

export interface FanCategory {
  slug: string;
  label: string;
  count: number;
  href: string;
  /** 1–5 prints, one per cake, best first; licensed ones last. */
  photos: V2Photo[];
}

export interface Occasion {
  slug: string;
  label: string;
  count: number;
  href: string;
  main: V2Photo;
  /** 0–2 polaroids, always other cakes than `main`. */
  insets: V2Photo[];
}

export interface StoryCircle {
  slug: string;
  label: string;
  href: string;
  cover: V2Photo;
}

export interface SoireeData {
  hero: HeroCard[];
  tiles: V2Photo[];
  fan: FanCategory[];
  fanDefault: string;
  occasions: Occasion[];
  slider: { thumb: V2Photo; steps: V2Photo[]; chosen: V2Photo & { categoryLabel: string } };
  signature: V2Photo;
  stories: StoryCircle[];
  /** 6, 3 or 0 photos never shown elsewhere on the page. */
  grid: V2Photo[];
  /** Labels of the categories with cakes (ticket select, finale pills). */
  occasionLabels: { slug: string; label: string }[];
}

/** Home-only display labels (the database labels stay untouched). */
export interface LabelOverrides {
  /** Full label for a category slug, or undefined to keep the database label. */
  label?: (slug: string) => string | undefined;
  /** Short card label for a category slug. */
  short?: (slug: string) => string | undefined;
}

// The owner's strongest pictures, in the order the hero should meet them
// (mirrored in RTL so Arabic visitors meet them in the same order). The
// sequin-backdrop shot ("أمي", black sequins) opens on the ink hero.
const HERO_PICKS = [
  "gateau-hommage-maman#1",
  "tarte-papillons-princesse#0",
  "gateau-remise-diplome#0",
  "gateau-romantique-fleurs#0",
  "gateau-artistique#0",
  "gateau-princesse-couronnee#0",
  "gateau-chocolat-luxe#0",
  "gateau-floral-romantique#0",
  "gateau-degrade-pastel#0",
  "gateau-creation-coloree#0",
];
const HERO_COUNT = 10;

// On-brand (crimson / gold), no lettering: the engagement cake from above.
const SIGNATURE_PICKS = ["gateau-remise-diplome#1", "tarte-papillons-princesse#1"];
// A cake seen from above crops well in the round slider thumb.
const THUMB_PICKS = ["gateau-artistique#0", "gateau-degrade-pastel#0"];

// What each occasion shows first. The database is partly wrong (e.g. the
// "remise de diplôme" slug is an engagement cake), so the occasion photo is
// chosen by eye; the key's cake need not belong to that category.
const OCCASION_PICKS: Record<string, string> = {
  "birthday-kids": "gateau-pastel-douceur#0",
  "birthday-adults": "tarte-papillons-princesse#2",
  wedding: "gateau-artistique#0",
  graduation: "gateau-romantique-fleurs#0",
  grossesse: "gateau-chocolat-luxe#1",
};

/** Cakes filed under the wrong occasion in the database (kept out of slots that name the occasion). */
const MISFILED = new Set(["gateau-personnalise-special"]); // a birthday cake filed under weddings

/** An occasion needs at least this many different cakes to get a big word. */
const OCCASION_MIN_CAKES = 2;

function photosOf(cake: HomeCake): V2Photo[] {
  return cake.images.map((src) => ({
    src,
    alt: cake.title,
    slug: cake.slug,
    href: cake.href,
    categorySlug: cake.categorySlug,
    sensitive: cake.sensitive,
  }));
}

interface TakeOptions {
  /** Allow licensed / brand photos (they always come after clean ones). */
  sensitive?: boolean;
  /** Only photos nobody has used yet on the page. */
  unused?: boolean;
  /** At most this many photos of one cake (default 1). */
  perCake?: number;
}

class Pool {
  /** How many times each photo has been handed out. */
  private used = new Map<string, number>();
  private byKey = new Map<string, V2Photo>();
  /** Every showable photo, round-robin over the ranked cakes. */
  readonly all: V2Photo[];

  constructor(cakes: HomeCake[]) {
    const showable = cakes.filter((c) => !c.personal);
    const lists = showable.map(photosOf);
    const longest = Math.max(0, ...lists.map((l) => l.length));
    const out: V2Photo[] = [];
    for (let r = 0; r < longest; r++) for (const l of lists) if (l[r]) out.push(l[r]);
    this.all = out;
    for (const c of showable) photosOf(c).forEach((p, i) => this.byKey.set(`${c.slug}#${i}`, p));
  }

  mark(p: V2Photo) {
    this.used.set(p.src, (this.used.get(p.src) ?? 0) + 1);
    return p;
  }

  uses(p: V2Photo): number {
    return this.used.get(p.src) ?? 0;
  }

  /** A curated photo by "slug#index", never a sensitive one. */
  key(k: string): V2Photo | undefined {
    const p = this.byKey.get(k);
    return p && !p.sensitive ? p : undefined;
  }

  /**
   * Up to `n` photos matching `filter`: clean before sensitive, least used
   * first (ties keep the ranking), different cakes before a cake repeats.
   */
  take(n: number, filter: (p: V2Photo) => boolean = () => true, opts: TakeOptions = {}): V2Photo[] {
    const { sensitive = false, unused = false, perCake = 1 } = opts;
    const ok = this.all
      .map((p, rank) => ({ p, rank }))
      .filter(({ p }) => filter(p) && (sensitive || !p.sensitive) && (!unused || this.uses(p) === 0))
      .sort(
        (a, b) =>
          Number(a.p.sensitive) - Number(b.p.sensitive) || this.uses(a.p) - this.uses(b.p) || a.rank - b.rank
      )
      .map(({ p }) => p);
    const out: V2Photo[] = [];
    const count = (slug: string) => out.filter((p) => p.slug === slug).length;
    for (let round = 1; round <= perCake; round++) {
      for (const p of ok) {
        if (out.length >= n) break;
        if (out.includes(p) || count(p.slug) >= round) continue;
        out.push(p);
      }
    }
    out.forEach((p) => this.mark(p));
    return out;
  }

  first(keys: string[], filter?: (p: V2Photo) => boolean): V2Photo | undefined {
    for (const k of keys) {
      const p = this.key(k);
      if (p) return this.mark(p);
    }
    return this.take(1, filter)[0];
  }
}

export function buildSoireeData(home: HomeData, overrides: LabelOverrides = {}): SoireeData | null {
  const { cakes } = home;
  const categories: HomeCategory[] = home.categories.map((c) => ({
    ...c,
    label: overrides.label?.(c.slug) ?? c.label,
  }));
  if (categories.length === 0 || cakes.length === 0) return null;
  const pool = new Pool(cakes);
  if (pool.all.length === 0) return null;
  const catBySlug = new Map<string, HomeCategory>(categories.map((c) => [c.slug, c]));
  const labelOf = (slug: string) => catBySlug.get(slug)?.label ?? slug;
  const coverOf = (c: HomeCategory): V2Photo =>
    pool.all.find((p) => p.src === c.cover.src && !p.sensitive) ??
    pool.all.find((p) => p.categorySlug === c.slug && !p.sensitive) ??
    pool.all.find((p) => !p.sensitive) ??
    pool.all[0];

  // 1 · Hero: curated picks, then the best unused photos, max 10 cards.
  const heroPhotos: V2Photo[] = [];
  for (const k of HERO_PICKS) {
    const p = pool.key(k);
    if (p && heroPhotos.length < HERO_COUNT) heroPhotos.push(pool.mark(p));
  }
  if (heroPhotos.length < HERO_COUNT) heroPhotos.push(...pool.take(HERO_COUNT - heroPhotos.length));
  const hero: HeroCard[] = heroPhotos.map((p) => ({
    ...p,
    label: labelOf(p.categorySlug),
    shortLabel: overrides.short?.(p.categorySlug) ?? labelOf(p.categorySlug),
    galleryHref: galleryHref(p.categorySlug),
  }));

  // 6 · House: the signature print (reserved early so it stays unique).
  const signature = pool.first(SIGNATURE_PICKS) ?? heroPhotos[0];
  // 5 · Slider thumb.
  const thumb = pool.first(THUMB_PICKS) ?? heroPhotos[0];

  // 5 · How it works: four photos nobody else uses; the first is the "chosen" card.
  // 4 · Reserve the curated occasion photos now, so later sections skip them.
  const occasionPick = new Map<string, V2Photo>();
  for (const [slug, key] of Object.entries(OCCASION_PICKS)) {
    const p = pool.key(key);
    if (p && catBySlug.has(slug)) occasionPick.set(slug, pool.mark(p));
  }

  // (Never a misfiled cake: the first card names its category.)
  const fit = (p: V2Photo) => !MISFILED.has(p.slug);
  const steps = pool.take(4, fit, { unused: true });
  if (steps.length < 4) steps.push(...pool.take(4 - steps.length, fit));
  const chosenPhoto = steps[0] ?? signature;
  const chosen = { ...chosenPhoto, categoryLabel: labelOf(chosenPhoto.categorySlug) };

  // 2 · Four tiles: one tucked photo each, least used first.
  const tiles = pool.take(4);

  // 4 · Occasions: categories with ≥ 2 different showable cakes (a single
  // ~720px phone shot cannot carry a full-bleed card). Main = curated pick;
  // insets = other cakes of the same category.
  const occasions: Occasion[] = [];
  for (const c of categories) {
    const inCat = (p: V2Photo) => p.categorySlug === c.slug;
    const cleanCakes = new Set(pool.all.filter((p) => inCat(p) && !p.sensitive).map((p) => p.slug));
    if (cleanCakes.size < OCCASION_MIN_CAKES) continue;
    const main = occasionPick.get(c.slug) ?? pool.take(1, inCat)[0];
    if (!main) continue;
    const insets = pool.take(2, (p) => inCat(p) && p.slug !== main.slug && !MISFILED.has(p.slug));
    occasions.push({ slug: c.slug, label: c.label, count: c.count, href: c.href, main, insets });
  }

  // 3 · Fan: one print per cake (best first); licensed ones only to reach a
  // fan of three; fewer cakes → fewer prints.
  const fan: FanCategory[] = categories.map((c) => {
    const inCat = (p: V2Photo) => p.categorySlug === c.slug;
    const clean = pool.take(5, inCat);
    const filler = clean.length < 3 ? pool.take(3 - clean.length, (p) => inCat(p) && p.sensitive, { sensitive: true }) : [];
    return { slug: c.slug, label: c.label, count: c.count, href: c.href, photos: [...clean, ...filler] };
  });
  // Open on the category with the most different clean cakes.
  const cleanCount = (f: FanCategory) => f.photos.filter((p) => !p.sensitive).length;
  const fanDefault = [...fan].sort((a, b) => cleanCount(b) - cleanCount(a))[0]?.slug ?? fan[0].slug;

  // 9 · Stories: category covers; a grid of photos shown nowhere else
  // (6, else 3, else none — the circles and the follow pill remain).
  const stories: StoryCircle[] = categories.map((c) => ({
    slug: c.slug,
    label: c.label,
    href: c.href,
    cover: coverOf(c),
  }));
  const fresh = pool.take(6, () => true, { unused: true, perCake: 2 });
  const grid = fresh.length >= 6 ? fresh : fresh.length >= 3 ? fresh.slice(0, 3) : [];

  return {
    hero,
    tiles,
    fan,
    fanDefault,
    occasions,
    slider: { thumb, steps, chosen },
    signature,
    stories,
    grid,
    occasionLabels: categories.map((c) => ({ slug: c.slug, label: c.label })),
  };
}
