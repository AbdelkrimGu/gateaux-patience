import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { Namespace } from "@/i18n/messages";

/**
 * Ships only the namespaces a client subtree needs (plus `common`), instead
 * of the whole catalogue (admin strings included) in every page's RSC payload.
 *
 *   <IntlIsland namespaces={["home"]}><HeroClient /></IntlIsland>
 *
 * Server components don't need this: they call getTranslations() directly.
 * Prefer translating on the server and passing strings as props; use an
 * island only when a client component really calls useTranslations().
 */
export async function IntlIsland({
  namespaces,
  children,
}: {
  namespaces: Namespace[];
  children: React.ReactNode;
}) {
  const all = await getMessages();
  const picked: Record<string, unknown> = { common: all.common };
  for (const ns of namespaces) picked[ns] = all[ns];
  return <NextIntlClientProvider messages={picked}>{children}</NextIntlClientProvider>;
}
