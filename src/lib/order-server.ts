import { getTranslations } from "next-intl/server";
import { orderHref, type OrderOptions, type OrderTranslator } from "./order";

/** Async server components: `const order = await getOrderHref(locale); order({ occasion })`. */
export async function getOrderHref(locale: string): Promise<(opts?: OrderOptions) => string> {
  const t = (await getTranslations({ locale, namespace: "order_wa" })) as unknown as OrderTranslator;
  return (opts = {}) => orderHref({ ...opts, t });
}
