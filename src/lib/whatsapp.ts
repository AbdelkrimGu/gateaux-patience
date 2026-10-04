// One builder for every WhatsApp link on the public site (DESIGN.md amend. 10).
//
//   buildWhatsAppUrl({ locale: "fr", kind: "cake",
//                      cake: { title: "Tarte Minecraft", ref: "GP-3K7Q" },
//                      name: "Ines", date: "2026-11-02", guests: 20,
//                      page: "/galerie/gateau-luxe-blanc-ivoire" })
//
//   // Filtered gallery (?c=wedding): "…un gâteau pour un mariage ou des fiançailles."
//   buildWhatsAppUrl({ locale, kind: "general", category: "wedding",
//                      page: "/galerie?c=wedding" })
//
// Message = greeting, what they want, the brief (name / date / guests) and the
// page link. Date and guests are always asked (with "…" when unknown) instead
// of quoting prices. Templates live in messages/<locale>/whatsapp.json.
// Pure and isomorphic: safe in server and client components (it ships ~1 KB
// of templates to the client).

import { CONTACT, SITE_URL } from "./constants";
import { occasionFor, type Occasion } from "./piping";
import fr from "../../messages/fr/whatsapp.json";
import ar from "../../messages/ar/whatsapp.json";
import en from "../../messages/en/whatsapp.json";

export type WhatsAppLocale = "fr" | "ar" | "en";
export type WhatsAppKind = "general" | "cake" | "tiramisu" | "sweets";

export interface WhatsAppOptions {
  locale: WhatsAppLocale | string;
  kind: WhatsAppKind;
  /** kind "general" only: say what the cake is for. `occasion` wins over
   *  `category` (a gallery category slug, e.g. the ?c= filter). Categories
   *  without a known occasion keep the generic sentence. */
  occasion?: Occasion;
  category?: string | null;
  /** Required for kind "cake" (falls back to "general" without it). */
  cake?: { title: string; ref: string };
  /** Name to pipe on the cake / letters on the tiramisu. */
  name?: string;
  /** ISO yyyy-mm-dd (from <input type="date">) or free text. */
  date?: string;
  guests?: number | string;
  /** Absolute URL, or an unprefixed site path ("/galerie/x") that gets the
   *  locale prefix; becomes "Vu ici : https://…". */
  page?: string;
  /** Extra lines appended before the link (e.g. a tiramisu summary). */
  extra?: string[];
}

type Templates = typeof fr;

/** Gallery category slug -> occasion, or null when the slug says nothing. */
export function occasionOfCategory(category: string | null | undefined): Occasion | null {
  if (!category || category === "all") return null;
  const o = occasionFor(category);
  if (o !== "birthday") return o;
  return /^(birthday|anniversaire)/.test(category) ? "birthday" : null;
}
const TEMPLATES: Record<WhatsAppLocale, Templates> = { fr, ar, en };

const WA_NUMBER = CONTACT.whatsapp.replace(/\D/g, "");

// Unicode first-strong isolate: keeps Latin refs/names/dates in place inside
// an Arabic message (WhatsApp honours FSI/PDI).
const FSI = "⁨";
const PDI = "⁩";

function fill(template: string, vars: Record<string, string>, isolate: boolean): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key] ?? "";
    return isolate ? `${FSI}${v}${PDI}` : v;
  });
}

function formatDate(value: string, locale: WhatsAppLocale): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return value.trim();
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  const tag = locale === "ar" ? "ar-DZ-u-nu-latn" : locale === "en" ? "en-GB" : "fr-FR";
  return new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Site path -> absolute, locale-prefixed URL (FR has no prefix: "as-needed"). */
function absolute(page: string, locale: WhatsAppLocale): string {
  if (/^https?:\/\//.test(page)) return page;
  const path = page.startsWith("/") ? page : `/${page}`;
  const prefixed = locale === "fr" ? path : `/${locale}${path === "/" ? "" : path}`;
  return `${SITE_URL}${prefixed}`;
}

export function buildWhatsAppMessage(opts: WhatsAppOptions): string {
  const locale: WhatsAppLocale = opts.locale === "ar" || opts.locale === "en" ? opts.locale : "fr";
  const t = TEMPLATES[locale];
  const rtl = locale === "ar";
  const kind = opts.kind === "cake" && !opts.cake ? "general" : opts.kind;

  const lines: string[] = [t.greeting];
  const occasion = kind === "general" ? (opts.occasion ?? occasionOfCategory(opts.category)) : null;
  lines.push(
    kind === "cake" && opts.cake
      ? fill(t.cake, { title: opts.cake.title.trim(), ref: opts.cake.ref }, rtl)
      : occasion
        ? t.occasion[occasion]
        : t[kind]
  );

  const name = opts.name?.trim();
  if (name) lines.push(fill(t.name, { name }, rtl));

  const date = opts.date?.trim();
  lines.push(
    date ? fill(t.date, { date: formatDate(date, locale) }, rtl) : fill(t.date, { date: t.blank }, false)
  );

  const guests = opts.guests === undefined ? "" : String(opts.guests).trim();
  lines.push(guests ? fill(t.guests, { guests }, rtl) : fill(t.guests, { guests: t.blank }, false));

  if (opts.extra?.length) lines.push(...opts.extra.filter(Boolean));
  // Never isolate the URL: linkifiers can swallow U+2069 into it (-> 404).
  // It sits alone at the end of its own line, so the bidi layout is fine.
  if (opts.page) lines.push(fill(t.link, { url: absolute(opts.page, locale) }, false));
  return lines.join("\n");
}

export function buildWhatsAppUrl(opts: WhatsAppOptions): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(opts))}`;
}

/** Bare chat link (no prefilled text): only where there is no context at all. */
export const WHATSAPP_CHAT_URL = `https://wa.me/${WA_NUMBER}`;
