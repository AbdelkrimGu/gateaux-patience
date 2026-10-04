import type { Cake } from "@/lib/db-types";
import { isWedding } from "@/lib/piping";
import type { BandPhoto } from "./MakeBands";
import { byPhotoQuality } from "@/components/gallery/catalog";

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
/** Bright, studio-lit and blue-accented (CoComelon) for the bleu band; the
 *  rocket cake carries a large centred watermark at band size (08-review M3). */
const CAKES_BAND_PICKS: Record<string, string> = { "gateau-cocomelon": "50% 45%", "tarte-de-lespace-avec-fusee": "50% 42%" };
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

  const notHero = withPhoto.filter((c) => c.id !== hero?.id);
  const cakesPhoto = bandPhoto(notHero, CAKES_BAND_PICKS, (c) => !isWedding(c.category));
  const weddingPhoto = bandPhoto(withPhoto, WEDDING_BAND_PICKS, (c) => isWedding(c.category));

  // Clean, crisp photos first (byPhotoQuality, 08-review M3), the rest in
  // catalogue order (featured, newest). Neither the hero cake nor the band
  // photos are repeated in the grid right below them.
  const shown = new Set([cakesPhoto?.src, weddingPhoto?.src]);
  const featured = byPhotoQuality(withPhoto)
    .filter((c) => c.id !== hero?.id && !shown.has(c.images[0]))
    .slice(0, FEATURED_MAX);

  return { hero, featured, cakesPhoto, weddingPhoto };
}
