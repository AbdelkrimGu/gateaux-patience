// Message catalogue: one JSON file per namespace, per locale
// (messages/<locale>/<namespace>.json). Static imports keep it bundle-safe
// and let TypeScript type `t()` keys from the French files (see global.d.ts).
//
// Adding a namespace = add the three JSON files AND a line per locale here,
// then run `npm run check:i18n`. (The pre-revamp namespaces about, admin,
// categories, featured, footer, hero, how_to_order, nav, order_modal, social
// and stats were deleted: nothing read them.)

import fr_cake from "../../messages/fr/cake.json";
import fr_common from "../../messages/fr/common.json";
import fr_gallery from "../../messages/fr/gallery.json";
import fr_home from "../../messages/fr/home.json";
import fr_meta from "../../messages/fr/meta.json";
import fr_tiramisuUi from "../../messages/fr/tiramisuUi.json";
import fr_universe from "../../messages/fr/universe.json";
import fr_whatsapp from "../../messages/fr/whatsapp.json";

import ar_cake from "../../messages/ar/cake.json";
import ar_common from "../../messages/ar/common.json";
import ar_gallery from "../../messages/ar/gallery.json";
import ar_home from "../../messages/ar/home.json";
import ar_meta from "../../messages/ar/meta.json";
import ar_tiramisuUi from "../../messages/ar/tiramisuUi.json";
import ar_universe from "../../messages/ar/universe.json";
import ar_whatsapp from "../../messages/ar/whatsapp.json";

import en_cake from "../../messages/en/cake.json";
import en_common from "../../messages/en/common.json";
import en_gallery from "../../messages/en/gallery.json";
import en_home from "../../messages/en/home.json";
import en_meta from "../../messages/en/meta.json";
import en_tiramisuUi from "../../messages/en/tiramisuUi.json";
import en_universe from "../../messages/en/universe.json";
import en_whatsapp from "../../messages/en/whatsapp.json";

const fr = {
  cake: fr_cake,
  common: fr_common,
  gallery: fr_gallery,
  home: fr_home,
  meta: fr_meta,
  tiramisuUi: fr_tiramisuUi,
  universe: fr_universe,
  whatsapp: fr_whatsapp,
};

const ar = {
  cake: ar_cake,
  common: ar_common,
  gallery: ar_gallery,
  home: ar_home,
  meta: ar_meta,
  tiramisuUi: ar_tiramisuUi,
  universe: ar_universe,
  whatsapp: ar_whatsapp,
};

const en = {
  cake: en_cake,
  common: en_common,
  gallery: en_gallery,
  home: en_home,
  meta: en_meta,
  tiramisuUi: en_tiramisuUi,
  universe: en_universe,
  whatsapp: en_whatsapp,
};

export type Messages = typeof fr;
export type Namespace = keyof Messages;

// ar/en are checked for key parity by scripts/check-messages.mjs, not by TS
// (their string values differ, so the literal types are not comparable).
export const MESSAGES: Record<"fr" | "ar" | "en", Messages> = {
  fr,
  ar: ar as unknown as Messages,
  en: en as unknown as Messages,
};
