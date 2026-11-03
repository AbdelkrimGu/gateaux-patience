import type { HomeCake, HomeCategory, HomeData, HomePhoto } from "@/lib/home-data";

/**
 * Hands out photos across the home sections so the same picture doesn't show
 * up three times on one page: every request prefers the least-used photos,
 * keeps the catalogue's ranking (on-brand first) within a usage level, and
 * never returns a sensitive photo unless explicitly allowed.
 */
export interface PhotoPicker {
  /** Up to `n` photos from `pool` (default: every photo), least used first. */
  take(n: number, opts?: { pool?: HomePhoto[]; allowSensitive?: boolean; exclude?: Set<string> }): HomePhoto[];
  /** Photos of one category. */
  ofCategory(cat: HomeCategory, n: number, opts?: { allowSensitive?: boolean; exclude?: Set<string> }): HomePhoto[];
  /** Up to `n` photos of one category, each from a different cake (non-sensitive). */
  ofCategoryDistinct(cat: HomeCategory, n: number): HomePhoto[];
  /** Up to `n` photos never handed out before (non-sensitive), catalogue order. */
  takeUnused(n: number): HomePhoto[];
  /** The first photo of a cake (marked as used). */
  ofCake(cake: HomeCake): HomePhoto | null;
}

function cakePhotos(cakes: HomeCake[]): HomePhoto[] {
  // One per cake first, then second photos… (same rule as home-data's pickPhotos).
  const out: HomePhoto[] = [];
  const longest = Math.max(0, ...cakes.map((c) => c.images.length));
  for (let round = 0; round < longest; round++) {
    for (const c of cakes) {
      const src = c.images[round];
      if (src) out.push({ src, alt: c.title, cakeSlug: c.slug, sensitive: c.sensitive });
    }
  }
  return out;
}

export function createPhotoPicker(data: HomeData): PhotoPicker {
  const all = cakePhotos(data.cakes);
  const uses = new Map<string, number>();
  const used = (p: HomePhoto) => uses.get(p.src) ?? 0;
  const mark = (p: HomePhoto) => uses.set(p.src, used(p) + 1);

  function take(n: number, opts: { pool?: HomePhoto[]; allowSensitive?: boolean; exclude?: Set<string> } = {}) {
    const pool = (opts.pool ?? all).filter(
      (p) => (opts.allowSensitive || !p.sensitive) && !opts.exclude?.has(p.src)
    );
    // Stable sort: least used first, catalogue order within a level; sensitive last.
    const ranked = pool
      .map((p, i) => ({ p, i }))
      .sort((a, b) => used(a.p) - used(b.p) || Number(a.p.sensitive) - Number(b.p.sensitive) || a.i - b.i)
      .map((x) => x.p);
    const out: HomePhoto[] = [];
    const seen = new Set<string>();
    for (const p of ranked) {
      if (out.length >= n) break;
      if (seen.has(p.src)) continue;
      seen.add(p.src);
      out.push(p);
    }
    out.forEach(mark);
    return out;
  }

  return {
    take,
    ofCategory(cat, n, opts) {
      return take(n, { pool: cakePhotos(cat.cakes), allowSensitive: opts?.allowSensitive, exclude: opts?.exclude });
    },
    ofCategoryDistinct(cat, n) {
      const out: HomePhoto[] = [];
      for (const cake of cat.cakes) {
        if (out.length >= n) break;
        if (cake.sensitive) continue;
        const [p] = take(1, { pool: cakePhotos([cake]) });
        if (p) out.push(p);
      }
      return out;
    },
    takeUnused(n) {
      const out = all.filter((p) => !p.sensitive && used(p) === 0).slice(0, n);
      out.forEach(mark);
      return out;
    },
    ofCake(cake) {
      const src = cake.images[0];
      if (!src) return null;
      const p = { src, alt: cake.title, cakeSlug: cake.slug, sensitive: cake.sensitive };
      mark(p);
      return p;
    },
  };
}
