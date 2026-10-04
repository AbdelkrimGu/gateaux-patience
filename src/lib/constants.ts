import contact from "./contact.json";

// Single source of truth: contact.json is also read by
// scripts/build-qr-contact.mjs to generate the static /contact page.
export const CONTACT = contact;

/** Production origin, no trailing slash — used for canonical URLs, sitemap, JSON-LD. */
export const SITE_URL = contact.siteUrl;

/** E.164 phone for tel: links and structured data, e.g. "+213669592850". */
export const PHONE_E164 = `+${contact.whatsapp.replace(/\D/g, "")}`;

/** National format for display, e.g. "0669 59 28 50" (wrap in <bdi className="ltr">). */
export const PHONE_LOCAL = contact.phone.replace(/^\+213\s*/, "0");

/** @deprecated use buildWhatsAppUrl() from src/lib/whatsapp.ts (prefilled message). */
export const WHATSAPP_URL = `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`;

export const CATEGORIES = [
  {
    id: "birthday-adults-women",
    slug: "anniversaire-femmes",
    parentId: "birthday-adults",
    labelKey: "birthday_adults_women",
    icon: "👩",
    color: "#F2A8AD",
  },
  {
    id: "birthday-adults-men",
    slug: "anniversaire-hommes",
    parentId: "birthday-adults",
    labelKey: "birthday_adults_men",
    icon: "👨",
    color: "#8FB8D4",
  },
  {
    id: "birthday-kids-girls",
    slug: "anniversaire-filles",
    parentId: "birthday-kids",
    labelKey: "birthday_kids_girls",
    icon: "👧",
    color: "#FFB6C1",
  },
  {
    id: "birthday-kids-boys",
    slug: "anniversaire-garcons",
    parentId: "birthday-kids",
    labelKey: "birthday_kids_boys",
    icon: "👦",
    color: "#87CEEB",
  },
  {
    id: "wedding",
    slug: "mariage-fiancailles",
    labelKey: "wedding",
    icon: "💍",
    color: "#D4AF37",
  },
  {
    id: "graduation",
    slug: "diplome",
    labelKey: "graduation",
    icon: "🎓",
    color: "#9B59B6",
  },
  {
    id: "daily",
    slug: "quotidien",
    labelKey: "daily",
    icon: "🎂",
    color: "#E8A87C",
  },
  {
    id: "customs",
    slug: "personnalises",
    labelKey: "customs",
    icon: "🧁",
    color: "#A8D8A8",
  },
  {
    id: "desserts",
    slug: "desserts",
    labelKey: "desserts",
    icon: "🍮",
    color: "#C9727A",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const MAIN_CATEGORIES = [
  {
    id: "birthday-adults",
    slug: "anniversaire-adultes",
    labelKey: "birthday_adults",
    descKey: "birthday_adults_desc",
    icon: "🎂",
    gradient: "from-rose-300 to-pink-400",
    image: "/categories/birthday-adults.jpg",
  },
  {
    id: "birthday-kids",
    slug: "anniversaire-enfants",
    labelKey: "birthday_kids",
    descKey: "birthday_kids_desc",
    icon: "🎠",
    gradient: "from-sky-300 to-violet-400",
    image: "/categories/birthday-kids.jpg",
  },
  {
    id: "wedding",
    slug: "mariage",
    labelKey: "wedding",
    descKey: "wedding_desc",
    icon: "💍",
    gradient: "from-amber-300 to-yellow-500",
    image: "/categories/wedding.jpg",
  },
  {
    id: "graduation",
    slug: "diplome",
    labelKey: "graduation",
    descKey: "graduation_desc",
    icon: "🎓",
    gradient: "from-purple-300 to-indigo-400",
    image: "/categories/graduation.jpg",
  },
  {
    id: "daily",
    slug: "quotidien",
    labelKey: "daily",
    descKey: "daily_desc",
    icon: "🍰",
    gradient: "from-orange-300 to-rose-300",
    image: "/categories/daily.jpg",
  },
  {
    id: "customs",
    slug: "personnalises",
    labelKey: "customs",
    descKey: "customs_desc",
    icon: "🧁",
    gradient: "from-emerald-300 to-teal-400",
    image: "/categories/customs.jpg",
  },
  {
    id: "desserts",
    slug: "desserts",
    labelKey: "desserts",
    descKey: "desserts_desc",
    icon: "🍮",
    gradient: "from-red-300 to-rose-500",
    image: "/categories/desserts.jpg",
  },
];
