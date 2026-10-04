// The three universes of the public site (07-intent-flow-spec §2):
// custom cakes (/galerie), sweets (/douceurs) and tiramisu (/tiramisu).
//
// A category belongs to `cakes` unless it says otherwise. The owner sets it
// in the admin ("Univers : Gâteaux / Douceurs"); until she does, a couple of
// slugs default to `sweets` AT READ TIME (universes-core.ts). Nothing here
// writes to the database.
//
// OWNER: to show sweets photos on /douceurs, create (or edit) a category in
// the admin, set "Univers" to "Douceurs", then add items to it. They leave
// /galerie and appear in the "déjà faites" grid on /douceurs.
//
// Server only (the getters read Mongo). Client components and tests import
// the pure helpers from `@/lib/universes-core`.

import { cache } from "react";
import { getAllPublishedCakes } from "./cakes-data";
import { getCategories } from "./categories-data";
import type { Cake, Category } from "./db-types";
import { cakesIn, categoryUniverse } from "./universes-core";

export * from "./universes-core";

/** /galerie: categories of the cakes universe (admin order). */
export const getCakesCategories = cache(async (): Promise<Category[]> =>
  (await getCategories()).filter((c) => categoryUniverse(c) === "cakes")
);

/** /galerie: published cakes outside the sweets universe. */
export const getCakesUniverseCakes = cache(async (): Promise<Cake[]> => {
  const [cakes, categories] = await Promise.all([getAllPublishedCakes(), getCategories()]);
  return cakesIn(cakes, categories, "cakes");
});

/** /douceurs: categories of the sweets universe (admin order). */
export const getSweetsCategories = cache(async (): Promise<Category[]> =>
  (await getCategories()).filter((c) => categoryUniverse(c) === "sweets")
);

/** /douceurs: published items in sweets categories. */
export const getSweetsCakes = cache(async (): Promise<Cake[]> => {
  const [cakes, categories] = await Promise.all([getAllPublishedCakes(), getCategories()]);
  return cakesIn(cakes, categories, "sweets");
});
