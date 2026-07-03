// Tiramisu base-asset intake check.
//
// Validates the 6 real per-template top-down box photos that will replace the
// procedural fallback surfaces. It NEVER fails the build — it only reports, so
// you can run it any time to see what's still missing or off-spec.
//
//   Run:  node scripts/check-tiramisu-assets.mjs
//
// Expected files (drop the real photos here):
//   public/images/tiramisu/templates/<template-id>/base.png
//
// Do NOT add pearls, border overlays, export, or AI generation — out of scope.

import sharp from "sharp";
import { existsSync, statSync } from "fs";
import { join } from "path";

const ROOT = "public/images/tiramisu";
const TEMPLATES = [
  "square-small",
  "square-medium",
  "square-large",
  "heart-medium",
  "heart-large",
  "oval-large",
];
const FALLBACK = {
  square: "boxes/cust-square.png",
  heart: "boxes/cust-heart.png",
  oval: "boxes/cust-oval.png",
};
const MIN = 900; // hard minimum (canvas renders at 900)
const PREFERRED = 1600; // preferred master size (crisp on retina)

const shapeOf = (id) => id.split("-")[0];
const C = {
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`,
  r: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  b: (s) => `\x1b[1m${s}\x1b[0m`,
};

console.log(C.b("\n  Tiramisu base-asset check"));
console.log(C.dim(`  Looking under ${ROOT}/templates/<id>/base.png\n`));

let present = 0;
let warnings = 0;

for (const id of TEMPLATES) {
  const rel = `templates/${id}/base.png`;
  const p = join(ROOT, rel);

  if (!existsSync(p)) {
    const fb = FALLBACK[shapeOf(id)];
    const fbOk = existsSync(join(ROOT, fb));
    console.log(
      `  ${C.y("○ MISSING")}  ${id.padEnd(14)} ${C.dim(
        `→ using fallback ${fb}${fbOk ? "" : C.r(" (fallback ALSO missing!)")}`
      )}`
    );
    warnings++;
    continue;
  }

  let m;
  try {
    m = await sharp(p).metadata();
  } catch (e) {
    console.log(`  ${C.r("✗ UNREADABLE")} ${id.padEnd(14)} ${C.r(e.message)}`);
    warnings++;
    continue;
  }

  const { width: w, height: h, hasAlpha } = m;
  const shortest = Math.min(w, h);
  const sizeKB = Math.round(statSync(p).size / 1024);

  const issues = [];
  if (w !== h) issues.push("not square");
  if (shortest < MIN) issues.push(`< ${MIN}px (too small)`);
  if (!hasAlpha) issues.push("no alpha (box should be a transparent cut-out)");
  const preferNote = shortest < PREFERRED ? ` ${C.y(`(prefer ≥ ${PREFERRED})`)}` : "";

  const ok = issues.length === 0 && shortest >= PREFERRED;
  const badge = issues.length ? C.y("⚠ CHECK  ") : ok ? C.g("✓ OK     ") : C.g("✓ OK     ");
  console.log(
    `  ${badge}  ${id.padEnd(14)} ${w}x${h}${preferNote}  alpha=${hasAlpha ? "yes" : C.y("no")}  ${C.dim(
      `${sizeKB}KB`
    )}  ${issues.length ? C.y(issues.join("; ")) : ""}`
  );
  present++;
  if (issues.length || shortest < PREFERRED) warnings++;
}

console.log("");
console.log(`  ${C.b(`${present}/6`)} real base photos present.`);
if (present < 6) {
  console.log(
    C.y(
      `  ${6 - present} template(s) still fall back to the procedural cust-*.png surface —`
    )
  );
  console.log(C.y("  those previews look generated, not like the real product."));
} else if (warnings === 0) {
  console.log(C.g("  All 6 real bases present and healthy. 🎉"));
}
console.log(
  C.dim("\n  (This check never fails the build — it only reports.)\n")
);
process.exit(0);
