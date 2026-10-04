import type { routing } from "./routing";
import type { Messages } from "./messages";

// Types `useTranslations` / `getTranslations` keys from messages/fr/*.json.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}
