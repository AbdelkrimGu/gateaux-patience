import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation APIs (next-intl v4). Prefer these over next/link and
// next/navigation in public UI so links keep the current locale prefix.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
