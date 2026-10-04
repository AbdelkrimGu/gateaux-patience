import { test } from "node:test";
import assert from "node:assert/strict";
import { cakesIn, categoryUniverse, isCategoryUniverse } from "./universes-core";
import type { Cake, Category } from "./db-types";

const cat = (slug: string, universe?: unknown) => ({ slug, universe }) as unknown as Category;
const cake = (id: string, category: string) => ({ id, category }) as unknown as Cake;

test("categoryUniverse: explicit value wins, read-time defaults otherwise", () => {
  assert.equal(categoryUniverse(cat("birthday-kids")), "cakes");
  assert.equal(categoryUniverse(cat("desserts")), "sweets");
  assert.equal(categoryUniverse(cat("customs")), "sweets");
  assert.equal(categoryUniverse(cat("customs", "cakes")), "cakes");
  assert.equal(categoryUniverse(cat("wedding", "sweets")), "sweets");
  assert.equal(categoryUniverse(cat("desserts", "nonsense")), "sweets");
  assert.equal(categoryUniverse(null), "cakes");
  assert.ok(isCategoryUniverse("sweets") && !isCategoryUniverse("tiramisu"));
});

test("cakesIn splits the catalogue; orphan categories stay in cakes", () => {
  const cats = [cat("birthday-kids"), cat("customs"), cat("wedding", "sweets")];
  const cakes = [cake("a", "birthday-kids"), cake("b", "customs"), cake("c", "wedding"), cake("d", "deleted-cat")];
  assert.deepEqual(cakesIn(cakes, cats, "cakes").map((c) => c.id), ["a", "d"]);
  assert.deepEqual(cakesIn(cakes, cats, "sweets").map((c) => c.id), ["b", "c"]);
});
