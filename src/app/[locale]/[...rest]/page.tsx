import { notFound } from "next/navigation";

// Any unknown path under a locale renders the localized 404
// (src/app/[locale]/not-found.tsx) instead of Next's default page.
export default function CatchAll() {
  notFound();
}
