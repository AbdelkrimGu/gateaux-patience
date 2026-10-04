import { ViewTransition } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { LocaleLink } from "@/i18n/LocaleLink";
import { localizePath } from "@/i18n/paths";
import { Button } from "@/components/ui/Button";
import { CakeCard, cakeTransitionName } from "@/components/ui/CakeCard";
import { EcrinSurface } from "@/components/ui/EcrinSurface";
import { Icon } from "@/components/ui/Icon";
import { CardTransitionScope } from "@/components/gallery/CardTransitionScope";
import { CakeStudio } from "@/components/gallery/CakeStudio";
import { PhotoStrip } from "@/components/gallery/PhotoStrip";
import { cakeDescription, cakeTitle, categoryLabel, dimensionsOf, relatedCakes } from "@/components/gallery/catalog";
import { getAllPublishedCakes, getAllPublishedSlugs, getCakeBySlug } from "@/lib/cakes-data";
import { cakeRef } from "@/lib/cake-ref";
import { PHONE_LOCAL, SITE_URL } from "@/lib/constants";
import { ogImage, pageMetadata } from "@/lib/seo";
import { isWedding, occasionFor, pipingFor, pipingStyle } from "@/lib/piping";
import { cn } from "@/lib/utils";
import styles from "@/components/gallery/gallery.module.css";
import { ViewTransitionStyles } from "@/components/gallery/ViewTransitionStyles";

// ISR: every published cake is prerendered at build (× 3 locales from the
// [locale] layout); new slugs render on first visit, then stay cached.
export const revalidate = 300;

export async function generateStaticParams() {
  return getAllPublishedSlugs();
}

type Params = Promise<{ locale: string; slug: string }>;

const abs = (locale: string, path: string) => `${SITE_URL}${localizePath(locale, path)}`;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  const cake = await getCakeBySlug(slug);
  if (!cake) return {};
  const t = await getTranslations({ locale, namespace: "cake" });
  const title = cakeTitle(cake, locale);
  const desc = cakeDescription(cake, locale);
  const description =
    desc.length > 40
      ? desc.length > 158
        ? `${desc.slice(0, 157).trimEnd()}…`
        : desc
      : t("meta_desc", { title, ref: cakeRef(cake.id) });
  return pageMetadata({
    locale,
    path: `/galerie/${slug}`,
    title: t("meta_title", { title }),
    description,
    image: ogImage(cake.images[0], title),
    type: "article",
  });
}

export default async function CakeDetailPage({ params }: { params: Params }) {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  setRequestLocale(locale);
  const [cake, all, t, tc] = await Promise.all([
    getCakeBySlug(slug),
    getAllPublishedCakes(),
    getTranslations({ locale, namespace: "cake" }),
    getTranslations({ locale, namespace: "common" }),
  ]);
  if (!cake) notFound();

  const title = cakeTitle(cake, locale);
  const description = cakeDescription(cake, locale);
  const category = categoryLabel(cake, locale);
  const ref = cakeRef(cake.id);
  const ecrin = isWedding(cake.category);
  const message = tc(`occasion.${occasionFor(cake.category)}`);
  const related = relatedCakes(cake, all, 4);
  const dims = dimensionsOf(cake);
  const page = `/galerie/${slug}`;

  const facts = [
    dims && {
      label: t("dimensions"),
      value: t("dimensions_value", { value: dims }),
    },
    cake.pieces ? { label: t("pieces"), value: String(cake.pieces) } : null,
    cake.persons ? { label: t("persons"), value: String(cake.persons) } : null,
  ].filter((f): f is { label: string; value: string } => !!f);

  const soft = ecrin ? "text-sucre/85" : "text-ink-soft";

  const titleBlock = (
    <div>
      <h1 className={ecrin ? cn(styles.ecrinTitle, "text-sucre") : "type-h2 text-piping"}>{title}</h1>
      <p className={cn("type-meta mt-3 flex flex-wrap gap-x-4 gap-y-1", soft)}>
        <span>{category}</span>
        <span>
          {t("ref_label")} <bdi className="ltr font-medium">{ref}</bdi>
        </span>
      </p>
    </div>
  );

  const details = (
    <>
      {description && <p className={cn("max-w-[60ch] whitespace-pre-line", soft)}>{description}</p>}

      <PhotoStrip
        images={cake.images}
        ecrin={ecrin}
        labels={{
          title: t("photos_title"),
          open: t.raw("photo_open") as string,
          alt: (t.raw("photo_alt") as string).replace("{title}", title),
          viewer: t("viewer_label", { title }),
          close: t("viewer_close"),
          prev: t("viewer_prev"),
          next: t("viewer_next"),
          count: t.raw("viewer_count") as string,
        }}
      />

      {facts.length > 0 && (
        <section aria-labelledby="cake-facts" className="mt-10">
          <h2 id="cake-facts" className="type-band">
            {t("facts_title")}
          </h2>
          <dl className="mt-4 flex flex-wrap gap-3">
            {facts.map((f) => (
              <div
                key={f.label}
                className={cn(
                  "min-w-[96px] rounded-[18px] px-4 py-3 whitespace-nowrap",
                  ecrin ? "bg-sucre/[0.06] bezel" : "bg-tint"
                )}
              >
                <dt className={cn("type-meta", ecrin ? "text-sucre/75" : "text-ink-muted")}>{f.label}</dt>
                <dd className={cn("mt-1 font-display text-2xl leading-tight", ecrin ? "text-cuivre" : "text-piping")}>
                  <bdi>{f.value}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  );

  const studio = (
    <CakeStudio
      locale={locale}
      cake={{ title, ref }}
      page={page}
      message={message}
      ecrin={ecrin}
      image={cake.images[0] ? { src: cake.images[0], alt: title } : undefined}
      caption={t("board_caption", { title, message })}
      slug={cake.slug}
      transitionName={cakeTransitionName(cake.slug)}
      boardStyle={pipingStyle(pipingFor(cake))}
      labels={{
        nameLabel: t("name_label"),
        namePlaceholder: t("name_placeholder"),
        nameHint: t("name_hint"),
        briefTitle: t("brief_title"),
        // Isolated + non-breaking hyphen: the ref never splits or reorders in Arabic.
        briefText: t("brief_text", { ref: `⁨${ref.replace("-", "‑")}⁩` }),
        dateLabel: t("date_label"),
        guestsLabel: t("guests_label"),
        guestsPlaceholder: t("guests_placeholder"),
        cta: t("cta"),
        opensWhatsApp: tc("order.opens_whatsapp"),
        barLabel: tc("order.cta"),
        barNavLabel: tc("order.bar_label"),
        barCallLabel: tc("order.call_aria", { phone: PHONE_LOCAL }),
      }}
      title={titleBlock}
      details={details}
    />
  );

  const back = (
    <nav aria-label={t("breadcrumb_label")} className="mb-2 desk:mb-8">
      <LocaleLink
        href="/galerie"
        className={cn(
          "type-meta -ms-2 inline-flex min-h-11 items-center gap-1.5 rounded-pill px-2 font-medium no-underline",
          ecrin ? "text-sucre/85 hover:text-sucre" : "text-ink-soft hover:text-ink"
        )}
      >
        <Icon name="back" size={18} />
        {t("back")}
      </LocaleLink>
    </nav>
  );

  const jsonLd = JSON.stringify([
    // ItemPage + CreativeWork (not Product): there is no price/offer to
    // publish, and a Product without offers/review is an invalid rich result.
    {
      "@context": "https://schema.org",
      "@type": "ItemPage",
      "@id": `${abs(locale, page)}#page`,
      url: abs(locale, page),
      name: title,
      inLanguage: locale,
      isPartOf: { "@type": "WebSite", name: "Gateaux Patience", url: `${SITE_URL}/` },
      primaryImageOfPage: cake.images[0]
        ? { "@type": "ImageObject", contentUrl: cake.images[0], caption: title }
        : undefined,
      mainEntity: {
        "@type": "CreativeWork",
        "@id": `${abs(locale, page)}#cake`,
        name: title,
        description: description || undefined,
        genre: category,
        identifier: ref,
        image: cake.images.map((src) => ({ "@type": "ImageObject", contentUrl: src, caption: title })),
        creator: { "@id": `${SITE_URL}/#business` },
        dateCreated: cake.createdAt || undefined,
        dateModified: cake.updatedAt || undefined,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("home"),
          item: abs(locale, "/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: tc("nav.creations"),
          item: abs(locale, "/galerie"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title,
          item: abs(locale, page),
        },
      ],
    },
  ]).replace(/</g, "\\u003c");

  return (
    <ViewTransition default="none">
      <ViewTransitionStyles />
      {ecrin ? (
        <EcrinSurface as="section" aria-label={title} className="pt-2 pb-14 desk:pt-8 desk:pb-24">
          <div className="wrap">
            {back}
            {studio}
          </div>
        </EcrinSurface>
      ) : (
        <section
          aria-label={title}
          className="wrap pt-2 pb-14 desk:pt-8 desk:pb-24"
          style={pipingStyle(pipingFor(cake))}
        >
          {back}
          {studio}
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="cake-related" className="wrap [contain-intrinsic-size:auto_900px] [content-visibility:auto] pt-6 pb-16 desk:pt-16 desk:pb-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="cake-related" className="type-h2">
              {t("related_title")}
            </h2>
            <Button href="/galerie" variant="ghost" size="sm" iconEnd="chevron" className="hidden desk:inline-flex">
              {t("related_more")}
            </Button>
          </div>
          <CardTransitionScope>
            <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 desk:mt-10 desk:grid-cols-4 desk:gap-x-6">
              {related.map((c) => (
                <li key={c.id}>
                  <CakeCard cake={c} locale={locale} />
                </li>
              ))}
            </ul>
          </CardTransitionScope>
          <Button href="/galerie" variant="ghost" size="sm" iconEnd="chevron" className="mt-8 desk:hidden">
            {t("related_more")}
          </Button>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </ViewTransition>
  );
}
