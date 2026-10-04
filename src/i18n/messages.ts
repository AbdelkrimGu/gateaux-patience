// Message catalogue: one JSON file per namespace, per locale
// (messages/<locale>/<namespace>.json). Static imports keep it bundle-safe
// and let TypeScript type `t()` keys from the French files (see global.d.ts).
//
// Adding a namespace = add the three JSON files AND a line per locale here,
// then run `npm run check:i18n`. Page agents own the pre-created home,
// gallery, cake and tiramisuUi namespaces and should not need to edit this.

import fr_about from "../../messages/fr/about.json";
import fr_admin from "../../messages/fr/admin.json";
import fr_cake from "../../messages/fr/cake.json";
import fr_categories from "../../messages/fr/categories.json";
import fr_common from "../../messages/fr/common.json";
import fr_featured from "../../messages/fr/featured.json";
import fr_footer from "../../messages/fr/footer.json";
import fr_gallery from "../../messages/fr/gallery.json";
import fr_hero from "../../messages/fr/hero.json";
import fr_home from "../../messages/fr/home.json";
import fr_how_to_order from "../../messages/fr/how_to_order.json";
import fr_meta from "../../messages/fr/meta.json";
import fr_nav from "../../messages/fr/nav.json";
import fr_order_modal from "../../messages/fr/order_modal.json";
import fr_social from "../../messages/fr/social.json";
import fr_stats from "../../messages/fr/stats.json";
import fr_tiramisuUi from "../../messages/fr/tiramisuUi.json";
import fr_whatsapp from "../../messages/fr/whatsapp.json";

import ar_about from "../../messages/ar/about.json";
import ar_admin from "../../messages/ar/admin.json";
import ar_cake from "../../messages/ar/cake.json";
import ar_categories from "../../messages/ar/categories.json";
import ar_common from "../../messages/ar/common.json";
import ar_featured from "../../messages/ar/featured.json";
import ar_footer from "../../messages/ar/footer.json";
import ar_gallery from "../../messages/ar/gallery.json";
import ar_hero from "../../messages/ar/hero.json";
import ar_home from "../../messages/ar/home.json";
import ar_how_to_order from "../../messages/ar/how_to_order.json";
import ar_meta from "../../messages/ar/meta.json";
import ar_nav from "../../messages/ar/nav.json";
import ar_order_modal from "../../messages/ar/order_modal.json";
import ar_social from "../../messages/ar/social.json";
import ar_stats from "../../messages/ar/stats.json";
import ar_tiramisuUi from "../../messages/ar/tiramisuUi.json";
import ar_whatsapp from "../../messages/ar/whatsapp.json";

import en_about from "../../messages/en/about.json";
import en_admin from "../../messages/en/admin.json";
import en_cake from "../../messages/en/cake.json";
import en_categories from "../../messages/en/categories.json";
import en_common from "../../messages/en/common.json";
import en_featured from "../../messages/en/featured.json";
import en_footer from "../../messages/en/footer.json";
import en_gallery from "../../messages/en/gallery.json";
import en_hero from "../../messages/en/hero.json";
import en_home from "../../messages/en/home.json";
import en_how_to_order from "../../messages/en/how_to_order.json";
import en_meta from "../../messages/en/meta.json";
import en_nav from "../../messages/en/nav.json";
import en_order_modal from "../../messages/en/order_modal.json";
import en_social from "../../messages/en/social.json";
import en_stats from "../../messages/en/stats.json";
import en_tiramisuUi from "../../messages/en/tiramisuUi.json";
import en_whatsapp from "../../messages/en/whatsapp.json";

const fr = {
  about: fr_about,
  admin: fr_admin,
  cake: fr_cake,
  categories: fr_categories,
  common: fr_common,
  featured: fr_featured,
  footer: fr_footer,
  gallery: fr_gallery,
  hero: fr_hero,
  home: fr_home,
  how_to_order: fr_how_to_order,
  meta: fr_meta,
  nav: fr_nav,
  order_modal: fr_order_modal,
  social: fr_social,
  stats: fr_stats,
  tiramisuUi: fr_tiramisuUi,
  whatsapp: fr_whatsapp,
};

const ar = {
  about: ar_about,
  admin: ar_admin,
  cake: ar_cake,
  categories: ar_categories,
  common: ar_common,
  featured: ar_featured,
  footer: ar_footer,
  gallery: ar_gallery,
  hero: ar_hero,
  home: ar_home,
  how_to_order: ar_how_to_order,
  meta: ar_meta,
  nav: ar_nav,
  order_modal: ar_order_modal,
  social: ar_social,
  stats: ar_stats,
  tiramisuUi: ar_tiramisuUi,
  whatsapp: ar_whatsapp,
};

const en = {
  about: en_about,
  admin: en_admin,
  cake: en_cake,
  categories: en_categories,
  common: en_common,
  featured: en_featured,
  footer: en_footer,
  gallery: en_gallery,
  hero: en_hero,
  home: en_home,
  how_to_order: en_how_to_order,
  meta: en_meta,
  nav: en_nav,
  order_modal: en_order_modal,
  social: en_social,
  stats: en_stats,
  tiramisuUi: en_tiramisuUi,
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
