import type { Cake } from "@/lib/db-types";
import { isWedding } from "@/lib/piping";
import type { BandPhoto } from "./MakeBands";

/*
  Which real cakes the home page shows, from ONE catalogue query.

  Hero: a cake the owner flagged `hero` in the admin wins. Otherwise the
  art-directed pick: crisp photo with the name piped around the board, which
  is exactly what the ring lettering echoes. Then any featured cake.
  Band photos: an art-directed pick per band, else the first fitting cake.
  Every fallback keeps the page real if a cake is unpublished or renamed.
*/

/** Princesse Ghita: crisp 1085px photo, "PRINCESSE GHITA" around the board. */
const HERO_PICKS = ["gateau-princesse-couronnee", "gateau-cocomelon"];
/** Blue fondant (rocket): sits on the bleu band. */
const CAKES_BAND_PICKS: Record<string, string> = { "tarte-de-lespace-avec-fusee": "50% 42%" };
/** Engagement cake (hearts, ring, red bow). */
const WEDDING_BAND_PICKS: Record<string, string> = { "gateau-remise-diplome": "50% 52%" };

const FEATURED_MAX = 8;

const hasPhoto = (c: Cake) => c.images.length > 0 && !!c.images[0];

function bySlugs(cakes: Cake[], slugs: string[]) {
  for (const slug of slugs) {
    const hit = cakes.find((c) => c.slug === slug && hasPhoto(c));
    if (hit) return hit;
  }
  return undefined;
}

function bandPhoto(
  cakes: Cake[],
  picks: Record<string, string>,
  fallback: (c: Cake) => boolean,
): BandPhoto | undefined {
  const picked = bySlugs(cakes, Object.keys(picks));
  if (picked) return { src: picked.images[0], position: picks[picked.slug] };
  const any = cakes.find((c) => hasPhoto(c) && fallback(c));
  return any ? { src: any.images[0], position: "50% 40%" } : undefined;
}

/** `cakes` as returned by getAllPublishedCakes(): featured first, newest first. */
export function pickHomeCakes(cakes: Cake[]) {
  const withPhoto = cakes.filter(hasPhoto);
  const hero =
    withPhoto.find((c) => c.hero) ??
    bySlugs(withPhoto, HERO_PICKS) ??
    withPhoto.find((c) => c.featured) ??
    withPhoto[0] ??
    null;

  // Featured first (same order as getFeaturedCakes), topped up with the
  // newest others; the hero cake is not repeated right below itself.
  const featured = withPhoto.filter((c) => c.id !== hero?.id).slice(0, FEATURED_MAX);

  const cakesPhoto = bandPhoto(withPhoto, CAKES_BAND_PICKS, (c) => !isWedding(c.category) && c.id !== hero?.id);
  const weddingPhoto = bandPhoto(withPhoto, WEDDING_BAND_PICKS, (c) => isWedding(c.category));

  return { hero, featured, cakesPhoto, weddingPhoto };
}
