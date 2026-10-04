// i18n key parity: every messages/<locale>/<namespace>.json must have exactly
// the same keys (deep) and the same ICU placeholders as the French file.
//
//   npm run check:i18n
//
// Also fails on: a namespace file missing in one locale, empty strings,
// a namespace file that src/i18n/messages.ts does not import.

import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "messages");
const LOCALES = ["fr", "ar", "en"];
const REF = "fr";

const errors = [];
const nsOf = (l) =>
  readdirSync(join(DIR, l))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort();

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

// Top-level ICU argument names: {name}, {count, plural, ...} -> name, count.
function placeholders(str) {
  const names = new Set();
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "{") {
      if (depth === 0) {
        const m = /^\{\s*([A-Za-z0-9_]+)/.exec(str.slice(i));
        if (m) names.add(m[1]);
      }
      depth++;
    } else if (str[i] === "}") depth = Math.max(0, depth - 1);
  }
  return [...names].sort().join(",");
}

const load = (l, ns) => {
  try {
    return JSON.parse(readFileSync(join(DIR, l, `${ns}.json`), "utf8"));
  } catch (e) {
    errors.push(`${l}/${ns}.json: ${e.message}`);
    return {};
  }
};

const refNs = nsOf(REF);
for (const l of LOCALES) {
  const have = nsOf(l);
  for (const ns of refNs) if (!have.includes(ns)) errors.push(`${l}: missing namespace file ${ns}.json`);
  for (const ns of have) if (!refNs.includes(ns)) errors.push(`${l}: extra namespace file ${ns}.json (not in ${REF})`);
}

let keyCount = 0;
for (const ns of refNs) {
  const ref = flatten(load(REF, ns));
  keyCount += Object.keys(ref).length;
  for (const l of LOCALES) {
    const cur = l === REF ? ref : flatten(load(l, ns));
    for (const [k, v] of Object.entries(cur)) {
      if (typeof v !== "string") errors.push(`${l}/${ns}: ${k} is not a string`);
      else if (!v.trim()) errors.push(`${l}/${ns}: ${k} is empty`);
    }
    if (l === REF) continue;
    for (const k of Object.keys(ref)) {
      if (!(k in cur)) errors.push(`${l}/${ns}: missing key ${k}`);
      else if (typeof ref[k] === "string" && typeof cur[k] === "string" && placeholders(ref[k]) !== placeholders(cur[k]))
        errors.push(`${l}/${ns}: ${k} placeholders {${placeholders(cur[k])}} != fr {${placeholders(ref[k])}}`);
    }
    for (const k of Object.keys(cur)) if (!(k in ref)) errors.push(`${l}/${ns}: extra key ${k} (not in ${REF})`);
  }
}

// Every namespace must be wired into the static catalogue.
const index = readFileSync(join(ROOT, "src", "i18n", "messages.ts"), "utf8");
for (const l of LOCALES)
  for (const ns of nsOf(l))
    if (!index.includes(`messages/${l}/${ns}.json`)) errors.push(`src/i18n/messages.ts does not import ${l}/${ns}.json`);

if (errors.length) {
  console.error(`i18n check FAILED (${errors.length}):\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log(`i18n OK: ${refNs.length} namespaces x ${LOCALES.length} locales, ${keyCount} keys each.`);
