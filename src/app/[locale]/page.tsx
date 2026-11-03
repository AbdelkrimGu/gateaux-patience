import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { unstable_noStore as noStore } from "next/cache";
import SiteFrame from "@/components/gp/SiteFrame";
import Hero from "@/components/home-v1/Hero";
import PromiseSentence from "@/components/home-v1/PromiseSentence";
import MenuCard, { type MenuGroup } from "@/components/home-v1/MenuCard";
import PartyFolders, { type Folder } from "@/components/home-v1/PartyFolders";
import HouseNote from "@/components/home-v1/HouseNote";
import WatchOrder from "@/components/home-v1/WatchOrder";
import Faq from "@/components/home-v1/Faq";
import FollowStrip from "@/components/home-v1/FollowStrip";
import Finale from "@/components/home-v1/Finale";
import type { BowlCard } from "@/components/home-v1/BowlCarousel";
import type { StoryPhotos } from "@/components/home-v1/OrderScreens";
import { createPhotoPicker } from "@/components/home-v1/photos";
import { getHomeData, type HomeData, type HomePhoto } from "@/lib/home-data";
import "@/components/home-v1/home-v1.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    // home_title already contains the brand — skip the "%s | Gateaux Patience" template.
    title: { absolute: t("home_title") },
    description: t("home_desc"),
    alternates: {
      canonical: locale === "fr" ? "/" : `/${locale}`,
      languages: {
        fr: "/",
        ar: "/ar",
        en: "/en",
      },
    },
  };
}

const BOWL_CARDS = 10;
const TIRAMISU_THUMB = "/images/tiramisu/hero/hero-1.png";

/** Shapes the catalogue into what each section shows, spreading photos so the same picture rarely repeats. */
function plan(data: HomeData, customGroup: string, tiramisuRow: string) {
  const pick = createPhotoPicker(data);
  const cats = data.categories;

  // 1 · Bowl: every category's cover, then more photos of the best-stocked ones (marked duplicates).
  const cards: BowlCard[] = [];
  for (const c of cats) {
    const [p] = pick.ofCategory(c, 1);
    if (p) cards.push({ src: p.src, alt: p.alt, label: c.label, href: c.href });
  }
  const byCount = [...cats].sort((a, b) => b.count - a.count);
  for (let round = 0; cards.length < BOWL_CARDS && round < 4; round++) {
    for (const c of byCount) {
      if (cards.length >= BOWL_CARDS) break;
      const [p] = pick.ofCategory(c, 1);
      if (p && !cards.some((k) => k.src === p.src)) {
        cards.push({ src: p.src, alt: p.alt, label: c.label, href: c.href, duplicate: true });
      }
    }
  }
  // The best on-brand cake's category sits in the middle at first.
  const best = data.cakes.find((c) => !c.sensitive);
  const startIndex = Math.max(0, cards.findIndex((k) => k.href.endsWith(`=${best?.categorySlug}`)));

  // 3 · Menu: categories with 2–3 named cakes (sensitive ones only if nothing else), + tiramisu.
  const groups: MenuGroup[] = cats.map((c) => {
    const safe = c.cakes.filter((k) => !k.sensitive);
    const pool = safe.length ? safe : c.cakes;
    const rows = pool.slice(0, c.count >= 5 ? 3 : 2).map((k) => ({
      name: k.title,
      href: k.href,
      thumb: pick.ofCake(k)?.src ?? c.cover.src,
    }));
    return { label: c.label, count: c.count, href: c.href, rows };
  });
  groups.push({ label: customGroup, rows: [{ name: tiramisuRow, href: "/tiramisu", thumb: TIRAMISU_THUMB }] });

  // 4 · Folders: the four best-stocked occasions, three photos each.
  const folders: Folder[] = byCount.slice(0, 4).map((c) => {
    let photos = pick.ofCategory(c, 3);
    if (photos.length < 3) photos = [...photos, ...pick.ofCategory(c, 3 - photos.length, { allowSensitive: true })];
    return { slug: c.slug, label: c.label, href: c.href, photos };
  });

  // 6 · Story: a cake with two photos (chosen in the gallery → the finished cake).
  const hero = data.cakes.find((c) => !c.sensitive && c.images.length >= 2) ?? data.cakes[0];
  let story: StoryPhotos | null = null;
  if (hero) {
    const chosen: HomePhoto = { src: hero.images[0], alt: hero.title, cakeSlug: hero.slug, sensitive: hero.sensitive };
    const finished: HomePhoto = { ...chosen, src: hero.images[1] ?? hero.images[0] };
    const seen = new Set([hero.slug]);
    const others = pick
      .take(12)
      .filter((p) => !seen.has(p.cakeSlug) && Boolean(seen.add(p.cakeSlug)))
      .slice(0, 5); // five different cakes for the gallery screen
    story = { chosen, others, finished };
  }


  // 8 · Strip: 14 photos, least shown first.
  let strip = pick.take(14);
  if (strip.length < 14) strip = [...strip, ...pick.take(14 - strip.length, { allowSensitive: true })];
  const rows: [HomePhoto[], HomePhoto[]] = [strip.filter((_, i) => i % 2 === 0), strip.filter((_, i) => i % 2 === 1)];

  return {
    cards,
    startIndex,
    groups,
    folders,
    story,

    rows,
    occasions: cats.map((c) => c.label),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  noStore();
  const [data, tm] = await Promise.all([
    getHomeData(locale),
    getTranslations({ locale, namespace: "home.menu" }),
  ]);
  const p = plan(data, tm("custom_group"), tm("tiramisu_row"));

  return (
    <SiteFrame locale={locale} footer="curtain">
      <Hero locale={locale} cards={p.cards} startIndex={p.startIndex} />
      <PromiseSentence locale={locale} />
      <MenuCard locale={locale} groups={p.groups} />
      {p.folders.length ? <PartyFolders locale={locale} folders={p.folders} /> : null}
      <HouseNote locale={locale} />
      {p.story ? <WatchOrder locale={locale} photos={p.story} /> : null}
      <Faq locale={locale} />
      <FollowStrip locale={locale} rows={p.rows} />
      <Finale locale={locale} occasions={p.occasions} />
    </SiteFrame>
  );
}
