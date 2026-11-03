import { galleryHref, type HomeCake, type HomeCategory, type HomeData } from "@/lib/home-data";

/**
 * "Soirée royale" line-up: turns the home data into the photo choices of each
 * section. A shared pool hands out unused photos first so the same cake does
 * not appear three times on the page (adaptation.md), and sensitive photos
 * (licensed characters, brands, people) never reach a first-impression slot.
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
  label: string;
  /** Gallery filtered by the card's category. */
  galleryHref: string;
}

export interface FanCategory {
  slug: string;
  label: string;
  count: number;
  href: string;
  photos: V2Photo[];
}

export interface Occasion {
  slug: string;
  label: string;
  count: number;
  href: string;
  main: V2Photo;
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
  slider: { thumb: V2Photo; steps: V2Photo[]; chosen: V2Photo };
  signature: V2Photo;
  stories: StoryCircle[];
  grid: V2Photo[];
  /** Labels of the categories with cakes (ticket select, finale pills). */
  occasionLabels: { slug: string; label: string }[];
}

// The owner's strongest pictures, in the order the hero should meet them.
// The sequin-backdrop shot ("أمي", black sequins) opens on the ink hero.
// Unknown or missing entries are skipped; the pool fills the rest.
const HERO_PICKS = [
  "gateau-hommage-maman#1",
  "gateau-personnalise-special#0",
  "tarte-papillons-princesse#0",
  "gateau-romantique-fleurs#0",
  "gateau-artistique#0",
  "gateau-princesse-couronnee#0",
  "gateau-remise-diplome#0",
  "gateau-floral-romantique#0",
  "gateau-degrade-pastel#0",
  "gateau-creation-coloree#0",
];
const HERO_COUNT = 10;

/** A child's photo on the topper: never on the home page, even as filler. */
const PERSONAL = new Set(["tarte-de-lespace-avec-fusee"]);

const SIGNATURE_PICKS =["gateau-personnalise-special#0", "gateau-artistique#0"];
const THUMB_PICKS = ["gateau-artistique#0", "gateau-degrade-pastel#0"];

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

class Pool {
  /** How many times each photo has been handed out. */
  private used = new Map<string, number>();
  private byKey = new Map<string, V2Photo>();
  readonly all: V2Photo[];

  constructor(cakes: HomeCake[]) {
    // Round-robin: first photo of every cake (best cakes first), then second photos…
    const lists = cakes.map(photosOf);
    const longest = Math.max(0, ...lists.map((l) => l.length));
    const out: V2Photo[] = [];
    for (let r = 0; r < longest; r++) for (const l of lists) if (l[r]) out.push(l[r]);
    this.all = out;
    for (const c of cakes) photosOf(c).forEach((p, i) => this.byKey.set(`${c.slug}#${i}`, p));
  }

  mark(p: V2Photo) {
    this.used.set(p.src, (this.used.get(p.src) ?? 0) + 1);
    return p;
  }

  uses(p: V2Photo): number {
    return this.used.get(p.src) ?? 0;
  }

  key(k: string): V2Photo | undefined {
    const p = this.byKey.get(k);
    return p && !p.sensitive ? p : undefined;
  }

  /**
   * `n` photos matching `filter`: least used first (ties keep the ranking),
   * one per cake before a second photo of the same cake, sensitive last and
   * only if `allowSensitive`.
   */
  take(n: number, filter: (p: V2Photo) => boolean = () => true, allowSensitive = false): V2Photo[] {
    const ok = this.all
      .map((p, rank) => ({ p, rank }))
      .filter(({ p }) => filter(p) && (allowSensitive || !p.sensitive) && !PERSONAL.has(p.slug))
      .sort(
        (a, b) =>
          Number(a.p.sensitive) - Number(b.p.sensitive) || this.uses(a.p) - this.uses(b.p) || a.rank - b.rank
      )
      .map(({ p }) => p);
    const out: V2Photo[] = [];
    const cakes = new Set<string>();
    const perCake = (slug: string) => out.filter((p) => p.slug === slug).length;
    // Passes: clean & new cake → clean any → sensitive & new cake → sensitive any.
    for (const [sensitive, distinct] of [
      [false, true],
      [false, false],
      [true, true],
      [true, false],
    ] as const) {
      for (const p of ok) {
        if (out.length >= n) break;
        if (p.sensitive !== sensitive || out.includes(p)) continue;
        if (distinct && cakes.has(p.slug)) continue;
        if (!sensitive && perCake(p.slug) >= 2) continue; // never three prints of one cake
        cakes.add(p.slug);
        out.push(p);
      }
    }
    out.forEach((p) => this.mark(p));
    return out;
  }

  first(keys: string[], filter?: (p: V2Photo) => boolean): V2Photo {
    for (const k of keys) {
      const p = this.key(k);
      if (p) return this.mark(p);
    }
    return this.take(1, filter)[0] ?? this.all[0];
  }
}

export function buildSoireeData(home: HomeData): SoireeData | null {
  const { categories, cakes } = home;
  if (categories.length === 0 || cakes.length === 0) return null;
  const pool = new Pool(cakes);
  const catBySlug = new Map<string, HomeCategory>(categories.map((c) => [c.slug, c]));
  const labelOf = (slug: string) => catBySlug.get(slug)?.label ?? slug;

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
    galleryHref: galleryHref(p.categorySlug),
  }));

  // 7 · House: the signature print (reserved early so it stays unique).
  const signature = pool.first(SIGNATURE_PICKS);
  // 5 · Slider thumb: a cake seen from above crops well in a circle.
  const thumb = pool.first(THUMB_PICKS);

  // 2 · Four tiles: one tucked photo each.
  const tiles = pool.take(4);

  // 5 · How it works: four step photos; step 1's photo is the "chosen" gallery card.
  const steps = pool.take(4);
  const chosen = steps[0] ?? signature;

  // 4 · Occasions: a main photo and up to two polaroids per category.
  const occasions: Occasion[] = categories.map((c) => {
    const inCat = (p: V2Photo) => p.categorySlug === c.slug;
    const [main, ...insets] = pool.take(3, inCat);
    return {
      slug: c.slug,
      label: c.label,
      count: c.count,
      href: c.href,
      main: main ?? photosOf(c.cakes[0])[0],
      insets,
    };
  });

  // 3 · Fan: five prints per category, best first (the fan puts the first one
  // on top in the centre); licensed characters only as filler at the edges.
  const fan: FanCategory[] = categories.map((c) => {
    const picked = pool.take(5, (p) => p.categorySlug === c.slug, true);
    const photos = [...picked.filter((p) => !p.sensitive), ...picked.filter((p) => p.sensitive)];
    return { slug: c.slug, label: c.label, count: c.count, href: c.href, photos };
  });
  // Open on the category with the most distinct on-brand-safe cakes.
  const cleanCakes = (f: FanCategory) => new Set(f.photos.filter((p) => !p.sensitive).map((p) => p.slug)).size;
  const fanDefault = [...fan].sort((a, b) => cleanCakes(b) - cleanCakes(a))[0]?.slug ?? fan[0].slug;

  // 9 · Stories: category covers + a 6-photo grid.
  const stories: StoryCircle[] = categories.map((c) => {
    const cover =
      pool.all.find((p) => p.src === c.cover.src) ??
      ({ ...c.cover, alt: c.cover.alt, slug: c.cover.cakeSlug, href: `/galerie/${c.cover.cakeSlug}`, categorySlug: c.slug } as V2Photo);
    return { slug: c.slug, label: c.label, href: c.href, cover };
  });
  const grid = pool.take(6);

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

/** next/image optimizer URL for CSS backgrounds (range thumb). Width must be a configured size. */
export function optimizedSrc(src: string, w: 64 | 96 | 128 | 256 = 96): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
}
