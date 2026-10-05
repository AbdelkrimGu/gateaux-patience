import { test } from "node:test";
import assert from "node:assert/strict";
import { parseWizardSnapshot } from "./memory";
import { VT_BACK, VT_FORWARD, VT_GATE, switchTypes, universeOfPath } from "./model";

test("universeOfPath maps routes to universes", () => {
  assert.equal(universeOfPath("/galerie"), "cakes");
  assert.equal(universeOfPath("/galerie/gateau-x"), "cakes");
  assert.equal(universeOfPath("/galerie?c=wedding"), "cakes");
  assert.equal(universeOfPath("/douceurs"), "sweets");
  assert.equal(universeOfPath("/tiramisu"), "tiramisu");
  assert.equal(universeOfPath("/"), null);
  assert.equal(universeOfPath("/galeries"), null);
});

test("switchTypes follows the switcher order", () => {
  assert.deepEqual(switchTypes("cakes", "tiramisu"), [VT_FORWARD]);
  assert.deepEqual(switchTypes("tiramisu", "sweets"), [VT_BACK]);
  assert.deepEqual(switchTypes(null, "sweets"), [VT_GATE]);
  assert.deepEqual(switchTypes("cakes", "cakes"), []);
});

const line = (o: Record<string, unknown> = {}) => ({ uid: "b1", optionId: "small-square", qty: 2, personalizations: [], ...o });

test("wizard snapshot: valid basket restores", () => {
  const snap = parseWizardSnapshot({ v: 1, step: "review", mode: "simple", activeCat: "large", bucket: [line()] });
  assert.deepEqual(snap, { step: "review", mode: "simple", activeCat: "large", bucket: [line()] });
});

test("wizard snapshot: wrong version or junk is ignored", () => {
  assert.equal(parseWizardSnapshot({ v: 2, step: "boxes", bucket: [line()] }), null);
  assert.equal(parseWizardSnapshot("nope"), null);
  assert.equal(parseWizardSnapshot(null), null);
});

test("wizard snapshot: unknown boxes are dropped, quantities clamped", () => {
  const snap = parseWizardSnapshot({
    v: 1,
    step: "bucket",
    bucket: [line({ optionId: "giant-star" }), line({ uid: "b2", optionId: "large-heart", qty: 500 }), line({ uid: "x", optionId: "large-oval" })],
  });
  assert.equal(snap?.bucket.length, 1);
  assert.equal(snap?.bucket[0].optionId, "large-heart");
  assert.equal(snap?.bucket[0].qty, 99);
});

test("wizard snapshot: personalizations are sanitised and capped by qty", () => {
  const p = { style: "pieces", sizeId: "large", lines: ["  inès <b>", 42] };
  const snap = parseWizardSnapshot({
    v: 1,
    step: "bucket",
    bucket: [line({ qty: 1, personalizations: [p, p, { style: "glitter", sizeId: "large", lines: [] }] })],
  });
  assert.equal(snap?.bucket[0].personalizations.length, 1);
  assert.deepEqual(snap?.bucket[0].personalizations[0].lines, ["  INES B", ""]);
});

test("wizard snapshot: form step reopens on review, empty basket goes to boxes", () => {
  assert.equal(parseWizardSnapshot({ v: 1, step: "confirm", bucket: [line()] })?.step, "review");
  assert.equal(parseWizardSnapshot({ v: 1, step: "review", bucket: [] })?.step, "boxes");
  assert.equal(parseWizardSnapshot({ v: 1, step: "mode", bucket: [] }), null);
  assert.equal(parseWizardSnapshot({ v: 1, step: "mode", bucket: [line()] })?.step, "bucket");
});
