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
/** Owner titles with a typo: never the face of a section (they stay in the gallery). */
const NOT_A_STAR = new Set(["gateau-remise-diplome"]);

/** Reorders photos so the same cake doesn't appear twice in a row (round-robin by cake). */
function spreadByCake(photos: HomePhoto[]): HomePhoto[] {
  const groups = new Map<string, HomePhoto[]>();
  for (const p of photos) groups.set(p.cakeSlug, [...(groups.get(p.cakeSlug) ?? []), p]);
  const queues = [...groups.values()];
  const out: HomePhoto[] = [];
  while (out.length < photos.length) for (const q of queues) if (q.length) out.push(q.shift()!);
  return out;
}

/** Shapes the catalogue into what each section shows, spreading photos so the same picture rarely repeats. */
function plan(
  data: HomeData,
  customGroup: string,
  tiramisuRow: string,
  shortLabel: (slug: string) => string | undefined
) {
  const pick = createPhotoPicker(data);
  const cats = data.categories;
  const byCount = [...cats].sort((a, b) => b.count - a.count);

  // 1 · Bowl: one card per category (short label) + on-brand cakes (no label) up
  // to 10, so no label repeats in view. Ordered by how on-brand the photo is,
  // then laid round the ring from the middle outwards (0, +1, −1, +2, …): the
  // first phone view leads with crimson / gold / chocolate.
  type Ranked = { card: BowlCard; rank: number };
  const ranked: Ranked[] = [];
  const rankOf = (slug: string) => {
    const i = data.cakes.findIndex((k) => k.slug === slug);
    return i < 0 ? 999 : i;
  };
  for (const c of cats) {
    const [p] = pick.ofCategory(c, 1);
    if (!p) continue;
    ranked.push({
      rank: rankOf(p.cakeSlug),
      card: { slug: `cat-${c.slug}`, src: p.src, name: c.label, label: shortLabel(c.slug) ?? c.label, href: c.href },
    });
  }
  const covered = new Set(ranked.map((r) => r.card.src));
  for (const k of data.cakes) {
    if (ranked.length >= BOWL_CARDS) break;
    if (k.sensitive || NOT_A_STAR.has(k.slug) || covered.has(k.images[0])) continue;
    const p = pick.ofCake(k);
    if (!p) continue;
    ranked.push({ rank: rankOf(k.slug), card: { slug: `cake-${k.slug}`, src: p.src, name: k.title, href: k.href } });
  }
  ranked.sort((a, b) => a.rank - b.rank);
  const n = ranked.length;
  const cards: BowlCard[] = new Array(n);
  ranked.forEach((r, j) => {
    const pos = j === 0 ? 0 : j % 2 === 1 ? (j + 1) / 2 : -j / 2;
    cards[(pos + n) % n] = r.card;
  });
  const startIndex = 0;

  // 3 · Menu: categories with 2–3 named cakes (sensitive ones only if nothing else), + tiramisu.
  const groups: MenuGroup[] = cats.map((c) => {
    const safe = c.cakes.filter((k) => !k.sensitive);
    const pool = safe.length ? safe : c.cakes;
    const rows = pool.slice(0, c.count >= 5 ? 3 : 2).map((k) => ({
      name: k.title,
      href: k.href,
      thumb: pick.ofCake(k)?.src ?? c.cover.src,
    }));
    return { label: c.label, href: c.href, rows };
  });
  groups.push({ label: customGroup, rows: [{ name: tiramisuRow, href: "/tiramisu", thumb: TIRAMISU_THUMB }] });

  // 4 · Folders: the four best-stocked occasions, three different cakes each when possible.
  const folders: Folder[] = byCount.slice(0, 4).map((c) => {
    let photos = pick.ofCategoryDistinct(c, 3);
    if (photos.length < 3) {
      const exclude = new Set(photos.map((p) => p.src));
      photos = [...photos, ...pick.ofCategory(c, 3 - photos.length, { allowSensitive: true, exclude })];
    }
    return { slug: c.slug, label: c.label, href: c.href, photos };
  });

  // 6 · Story: the best on-brand cake (chocolate heart) from gallery to table;
  // a different cake as "your inspiration"; five other cakes in the gallery.
  const star = data.cakes.find((k) => !k.sensitive && !NOT_A_STAR.has(k.slug)) ?? data.cakes[0];
  let story: StoryPhotos | null = null;
  if (star) {
    const chosen: HomePhoto = { src: star.images[0], alt: star.title, cakeSlug: star.slug, sensitive: star.sensitive };
    const finished: HomePhoto = { ...chosen, src: star.images[1] ?? star.images[0] };
    const seen = new Set([star.slug, ...NOT_A_STAR]);
    const distinct = pick
      .take(16)
      .filter((p) => !seen.has(p.cakeSlug) && Boolean(seen.add(p.cakeSlug)));
    const [inspiration, ...others] = distinct;
    story = { chosen, finished, inspiration: inspiration ?? chosen, others: others.slice(0, 5) };
  }

  // 8 · Strip: photos not shown anywhere above first, then the least shown, to
  // 14 tiles (two rows must stay wider than the screen while they drift);
  // spread so two photos of one cake never sit side by side.
  let strip = pick.takeUnused(14);
  if (strip.length < 14) {
    const exclude = new Set(strip.map((p) => p.src));
    strip = [...strip, ...pick.take(14 - strip.length, { exclude })];
  }
  strip = spreadByCake(strip);
  const rows: [HomePhoto[], HomePhoto[]] = [strip.filter((_, i) => i % 2 === 0), strip.filter((_, i) => i % 2 === 1)];

  return { cards, startIndex, groups, folders, story, rows, occasions: cats.map((c) => c.label) };
}
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  noStore();
  const [data, tm, th] = await Promise.all([
    getHomeData(locale),
    getTranslations({ locale, namespace: "home.menu" }),
    getTranslations({ locale, namespace: "home.hero" }),
  ]);
  const short = (slug: string) => (th.has(`short.${slug}`) ? th(`short.${slug}`) : undefined);
  const p = plan(data, tm("custom_group"), tm("tiramisu_row"), short);

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
