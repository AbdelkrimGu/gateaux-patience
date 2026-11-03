import { useTranslations } from "next-intl";
import { CONTACT } from "./constants";

/**
 * Ordering links. Today every order opens WhatsApp with a prefilled message in
 * the visitor's language; when the cake configurator ships, only `orderHref`
 * changes and every CTA follows.
 *
 * - Client or server (non-async) components: `const order = useOrderHref(); order({ occasion })`
 * - Async server components: `const order = await getOrderHref(locale)` (order-server.ts)
 * - Low level / tests: `whatsappHref({ t, occasion, cakeTitle, text, details })`
 */

/** Max length of the prefilled WhatsApp text (WhatsApp accepts more; we keep it readable). */
export const ORDER_TEXT_MAX = 600;

/** WhatsApp number as digits only, e.g. "213669592850". */
export const WHATSAPP_DIGITS = CONTACT.whatsapp.replace(/\D/g, "");

/** Translator for the `order_wa` messages namespace (from next-intl). */
export type OrderTranslator = (
  key: "hello" | "generic" | "occasion" | "cake" | "detail",
  values?: Record<string, string>
) => string;

export interface OrderOptions {
  /** Occasion label in the current locale, e.g. a category label. */
  occasion?: string;
  /** Cake title in the current locale. */
  cakeTitle?: string;
  /** Free text typed by the visitor (composer). Replaces the generic line. */
  text?: string;
  /** Structured lines, e.g. [{ label: "Date", value: "12/06" }] → "Date : 12/06". */
  details?: { label: string; value: string }[];
}

/** Collapse runs of spaces/tabs, trim each line, drop blank lines at the ends. */
function tidy(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Cut to `max` characters without splitting a surrogate pair, adding "…". */
function clip(s: string, max: number): string {
  const chars = Array.from(s);
  if (chars.length <= max) return s;
  return chars.slice(0, Math.max(0, max - 1)).join("").trimEnd() + "…";
}

/** The localized message text (not encoded), at most ORDER_TEXT_MAX characters. */
export function orderText(t: OrderTranslator, opts: OrderOptions = {}): string {
  const lines: string[] = [t("hello")];
  const text = opts.text ? tidy(opts.text) : "";
  const cakeTitle = opts.cakeTitle?.trim();
  const occasion = opts.occasion?.trim();

  if (cakeTitle) lines.push(t("cake", { cake: cakeTitle }));
  else if (occasion && !text) lines.push(t("occasion", { occasion }));
  // No cake, no occasion: still say what this is about, even with details.
  else if (!text) lines.push(t("generic"));

  for (const d of opts.details ?? []) {
    const value = tidy(d.value);
    if (value) lines.push(t("detail", { label: d.label.trim(), value }));
  }

  const head = lines.join("\n");
  if (!text) return clip(head, ORDER_TEXT_MAX);
  // Keep the greeting/context; trim the visitor's text to what still fits.
  const room = ORDER_TEXT_MAX - Array.from(head).length - 1;
  return room > 20 ? `${head}\n${clip(text, room)}` : clip(`${head}\n${text}`, ORDER_TEXT_MAX);
}

/** `https://wa.me/<digits>?text=<encoded localized message>`. */
export function whatsappHref(opts: OrderOptions & { t: OrderTranslator }): string {
  const { t, ...rest } = opts;
  return `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(orderText(t, rest))}`;
}

/** The one entry point for "Commander" links (today: WhatsApp). */
export function orderHref(opts: OrderOptions & { t: OrderTranslator }): string {
  return whatsappHref(opts);
}

/** Order links are external today: spread these on the <a>. */
export const ORDER_LINK_PROPS = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Hook: returns `(opts?) => href` bound to the current locale's messages. */
export function useOrderHref(): (opts?: OrderOptions) => string {
  const t = useTranslations("order_wa") as unknown as OrderTranslator;
  return (opts = {}) => orderHref({ ...opts, t });
}
