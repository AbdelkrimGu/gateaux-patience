/*
  What the site remembers between universes (07 §3 "returning visitor", §4.3,
  §4.7). Client-only helpers; every storage access is wrapped (private mode,
  blocked storage, quota) and the UI never depends on them.

  - Last universe visited  -> localStorage `gp:last:v1` (the home "Reprendre" chip)
  - Tiramisu wizard state  -> sessionStorage `gp:tiramisu:v1` (source of truth in
    the tab) + a dated mirror in localStorage, so a visitor who comes back
    another day (new tab) still finds their boxes. Restored only after
    validation against the catalogue.
  - Analytics hook         -> window "gp:intent" CustomEvent (no vendor yet).
*/

import { TIRAMISU_CATALOG, findOption } from "@/lib/tiramisu-catalog";
import { cleanTiramisuLine } from "@/lib/tiramisu-config";
import { isUniverse, universeOfPath, type Universe } from "./model";

const LAST_KEY = "gp:last:v1";
const TIRAMISU_KEY = "gp:tiramisu:v1";
/** The localStorage mirror is ignored after this long. */
const TIRAMISU_TTL_MS = 7 * 24 * 3600 * 1000;

function read(store: "local" | "session", key: string): unknown {
  try {
    const raw = (store === "local" ? window.localStorage : window.sessionStorage).getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}
function write(store: "local" | "session", key: string, value: unknown) {
  try {
    const s = store === "local" ? window.localStorage : window.sessionStorage;
    if (value === null) s.removeItem(key);
    else s.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the site simply forgets */
  }
}

// ---------------------------------------------------------------- analytics
export type IntentSource = Universe | "home" | "cross-sell";

/** 07 §4.7: fired on a gate choice, a switcher tap and a cross-sell tap. */
export function emitIntent(universe: Universe, from: IntentSource | null) {
  try {
    window.dispatchEvent(new CustomEvent("gp:intent", { detail: { universe, from } }));
  } catch {
    /* old browsers without CustomEvent constructor */
  }
}

// ------------------------------------------------------------ last universe
export interface LastVisit {
  universe: Universe;
  /** Unprefixed path + query, e.g. "/galerie?c=wedding". */
  path: string;
}

export function rememberVisit(path: string) {
  const universe = universeOfPath(path);
  if (!universe) return;
  write("local", LAST_KEY, { universe, path, at: Date.now() });
}

export function readLastVisit(): LastVisit | null {
  const v = read("local", LAST_KEY) as Partial<LastVisit> | null;
  if (!v || !isUniverse(v.universe) || typeof v.path !== "string" || !v.path.startsWith("/")) return null;
  if (universeOfPath(v.path) !== v.universe) return null;
  return { universe: v.universe, path: v.path };
}

// ------------------------------------------------------------ tiramisu state
export type WizardStep = "mode" | "boxes" | "bucket" | "review" | "confirm";
const STEPS: WizardStep[] = ["mode", "boxes", "bucket", "review", "confirm"];

export interface SavedPersonalization {
  style: "cacao" | "pieces";
  sizeId: "large" | "medium" | "small";
  lines: string[];
}
export interface SavedLine {
  uid: string;
  optionId: string;
  qty: number;
  personalizations: SavedPersonalization[];
}
export interface WizardSnapshot {
  step: WizardStep;
  mode: "simple" | "custom";
  bucket: SavedLine[];
  activeCat: string;
}

const MAX_QTY = 99;
const MAX_LINES = 4;
const MAX_CHARS = 24;

function validPersonalization(p: unknown): SavedPersonalization | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  if (o.style !== "cacao" && o.style !== "pieces") return null;
  if (o.sizeId !== "large" && o.sizeId !== "medium" && o.sizeId !== "small") return null;
  if (!Array.isArray(o.lines)) return null;
  const lines = o.lines
    .slice(0, MAX_LINES)
    .map((l) => (typeof l === "string" ? cleanTiramisuLine(l).slice(0, MAX_CHARS) : ""));
  return { style: o.style, sizeId: o.sizeId, lines };
}

function validLine(l: unknown): SavedLine | null {
  if (!l || typeof l !== "object") return null;
  const o = l as Record<string, unknown>;
  if (typeof o.uid !== "string" || !/^b\d{1,6}$/.test(o.uid)) return null;
  if (typeof o.optionId !== "string" || !findOption(o.optionId)) return null;
  const qty = typeof o.qty === "number" && Number.isInteger(o.qty) ? Math.min(MAX_QTY, Math.max(1, o.qty)) : 0;
  if (!qty) return null;
  const pers = Array.isArray(o.personalizations)
    ? o.personalizations.map(validPersonalization).filter((p): p is SavedPersonalization => !!p)
    : [];
  return { uid: o.uid, optionId: o.optionId, qty, personalizations: pers.slice(0, qty) };
}

/** Parse + validate a stored snapshot; anything unknown is dropped, never trusted. */
export function parseWizardSnapshot(raw: unknown): WizardSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return null;
  const bucket = Array.isArray(o.bucket)
    ? o.bucket.map(validLine).filter((l): l is SavedLine => !!l)
    : [];
  // One line per option (the wizard merges identical boxes).
  const seen = new Set<string>();
  const unique = bucket.filter((l) => !seen.has(l.optionId) && !!seen.add(l.optionId));
  const mode = o.mode === "simple" ? "simple" : "custom";
  const activeCat =
    typeof o.activeCat === "string" && TIRAMISU_CATALOG.some((c) => c.id === o.activeCat) ? o.activeCat : TIRAMISU_CATALOG[0].id;
  let step: WizardStep = STEPS.includes(o.step as WizardStep) ? (o.step as WizardStep) : "mode";
  // No contact details are ever stored, so the form step reopens on the review.
  if (step === "confirm") step = "review";
  // A later step without boxes makes no sense: back to choosing boxes.
  if (unique.length === 0 && (step === "bucket" || step === "review")) step = "boxes";
  if (unique.length === 0 && step === "mode") return null;
  // Left from the first step with boxes waiting: come back to the basket.
  if (unique.length > 0 && step === "mode") step = "bucket";
  return { step, mode, bucket: unique, activeCat };
}

export function loadWizard(): WizardSnapshot | null {
  const fromTab = parseWizardSnapshot(read("session", TIRAMISU_KEY));
  if (fromTab) return fromTab;
  const mirror = read("local", TIRAMISU_KEY) as { at?: unknown } | null;
  if (!mirror || typeof mirror.at !== "number" || Date.now() - mirror.at > TIRAMISU_TTL_MS) return null;
  const snap = parseWizardSnapshot(mirror);
  // Another day: reopen on the basket (or the boxes), not mid-form.
  if (snap && snap.bucket.length > 0) return { ...snap, step: "bucket" };
  return null;
}

export function saveWizard(s: WizardSnapshot) {
  const empty = s.bucket.length === 0;
  const value = { v: 1, ...s, at: Date.now() };
  write("session", TIRAMISU_KEY, empty && s.step === "mode" ? null : value);
  write("local", TIRAMISU_KEY, empty ? null : value);
}

export function clearWizard() {
  write("session", TIRAMISU_KEY, null);
  write("local", TIRAMISU_KEY, null);
}

/** Boxes waiting in a saved tiramisu basket (for the home chip), 0 if none. */
export function savedTiramisuBoxes(): number {
  const snap = loadWizard();
  return snap ? snap.bucket.reduce((n, l) => n + l.qty, 0) : 0;
}
