import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Tag for public catalogue reads. Page code that caches cake/category reads
 * (`unstable_cache(fn, key, { tags: [CATALOG_TAG] })` or `'use cache'` +
 * `cacheTag(CATALOG_TAG)`) is invalidated by the admin save routes below.
 */
export const CATALOG_TAG = "catalog";

/** ISR window for public pages (seconds). Admin saves revalidate at once. */
export const PUBLIC_REVALIDATE = 300;

/**
 * Called by the admin cake/category API routes after a successful write.
 * Home, /galerie and every /galerie/[slug] in every locale live under the
 * [locale] layout, so one layout-level path revalidation covers them all
 * (with localePrefix "as-needed" the public URLs differ from route paths).
 */
export function revalidatePublicCatalog() {
  try {
    revalidateTag(CATALOG_TAG, "max"); // Next 16 signature: (tag, cacheLife profile)
    revalidatePath("/[locale]", "layout");
  } catch (err) {
    // Never fail an admin save because of cache invalidation.
    console.error("[revalidatePublicCatalog]", err instanceof Error ? err.message : err);
  }
}
