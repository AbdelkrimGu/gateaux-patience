import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fnv1a } from "@/lib/hash";
import { ARABIC, hasArabic } from "./script";
import styles from "./LetteredBoard.module.css";

/*
  <LetteredBoard> — "la bordure", the signature component (B §2).

  A cake photo in a cake-tin plate, on a scalloped sugar board, with the
  celebration message piped around the bottom arc. Hook-free, so it renders on
  the server (LCP-safe) and inside client components (live name typing).

  LCP rules: the <Image> is never opacity-gated or animated; pass
  `image.priority` only when this board is the page's LCP element. The ring
  is decorative (aria-hidden); give a `caption` for screen readers.

  RTL/bidi (B §10): the arc is the same in every direction; the browser shapes
  Arabic on the textPath. The name is wrapped in Unicode isolates so a Latin
  name inside Arabic (or vice versa) keeps its own order. Latin is uppercased
  (her boards are), Arabic has no case. Nothing is split per letter.
*/

export interface LetteredBoardImage {
  src: string;
  alt: string;
  /** Default: phone min(58vw, 300px), desktop 380px. */
  sizes?: string;
  /** Only on the true LCP image of the page. */
  priority?: boolean;
  /** CSS object-position, e.g. "50% 40%". */
  position?: string;
}

export interface LetteredBoardProps {
  /** Occasion phrase, e.g. t("common.occasion.birthday"). */
  message: string;
  /** Visitor's name, appended after the message. */
  name?: string;
  tone?: "sucre" | "ecrin";
  /** Omit for an empty plate (placeholders): the tint mat shows. */
  image?: LetteredBoardImage;
  /** Small overlay at the plate's top-start corner, e.g. <RefTag />. */
  tag?: ReactNode;
  /** Plate content instead of a photo (e.g. an illustration on the 404). */
  children?: ReactNode;
  /** Visually hidden figcaption (the ring itself is aria-hidden). */
  caption?: string;
  /** "pipe" draws the lettering (CSS, reduced-motion aware). */
  animate?: "pipe" | "none";
  /**
   * Changing this remounts the lettering, replaying the pipe animation.
   * Default: message + name. Debounce it (~400 ms) when bound to typing.
   */
  pipeKey?: string;
  /** Delay before piping starts, ms (default 350). */
  pipeDelay?: number;
  /** BCP-47 tag used to uppercase Latin text correctly. */
  lang?: string;
  className?: string;
  style?: CSSProperties;
}

/** The scalloped board: 32 arcs around an ellipse, from the B mock. */
const SCALLOP =
  "M 342.0 251.0 A 20.1 20.1 0 0 1 337.8 290.9 A 20.1 20.1 0 0 1 325.4 329.1 A 20.1 20.1 0 0 1 305.3 363.9 A 20.1 20.1 0 0 1 278.5 393.7 A 20.1 20.1 0 0 1 246.0 417.3 A 20.1 20.1 0 0 1 209.3 433.6 A 20.1 20.1 0 0 1 170.1 441.9 A 20.1 20.1 0 0 1 129.9 441.9 A 20.1 20.1 0 0 1 90.7 433.6 A 20.1 20.1 0 0 1 54.0 417.3 A 20.1 20.1 0 0 1 21.5 393.7 A 20.1 20.1 0 0 1 -5.3 363.9 A 20.1 20.1 0 0 1 -25.4 329.1 A 20.1 20.1 0 0 1 -37.8 290.9 A 20.1 20.1 0 0 1 -42.0 251.0 A 20.1 20.1 0 0 1 -37.8 211.1 A 20.1 20.1 0 0 1 -25.4 172.9 A 20.1 20.1 0 0 1 -5.3 138.1 A 20.1 20.1 0 0 1 21.5 108.3 A 20.1 20.1 0 0 1 54.0 84.7 A 20.1 20.1 0 0 1 90.7 68.4 A 20.1 20.1 0 0 1 129.9 60.1 A 20.1 20.1 0 0 1 170.1 60.1 A 20.1 20.1 0 0 1 209.3 68.4 A 20.1 20.1 0 0 1 246.0 84.7 A 20.1 20.1 0 0 1 278.5 108.3 A 20.1 20.1 0 0 1 305.3 138.1 A 20.1 20.1 0 0 1 325.4 172.9 A 20.1 20.1 0 0 1 337.8 211.1 A 20.1 20.1 0 0 1 342.0 251.0 Z";

/** Bottom arc the lettering sits on (radius 172 → ~540 units long). */
const ARC = "M -22 251 A 172 172 0 0 0 322 251";
/** Arabic pages: 13 units further out, so Lalezar's tall alifs clear the plate. */
const ARC_AR = "M -35 251 A 185 185 0 0 0 335 251";
const ARC_BUDGET = 500; // usable length, leaves a margin at both ends
/** An Arabic name inside a Latin ring is set in Lalezar at this scale (CSS .arName). */
const AR_NAME_SCALE = 1.3;

const FSI = "⁨";
const PDI = "⁩";

/** Width estimate in em, calibrated on Dela Gothic One / Lalezar outlines. */
function estimateEm(text: string, tracking: number, arabicScale: number) {
  let em = 0;
  for (const ch of text) {
    if (ch === " ") em += 0.3;
    else if (ARABIC.test(ch)) em += 0.42 * arabicScale;
    else if (ch === FSI || ch === PDI) continue;
    else em += 0.95 + tracking;
  }
  return em;
}

export function ringLayout(text: string, opts: { arabicPage: boolean; ecrin: boolean }) {
  // Tracking only ever applies to Latin capitals: an Arabic run inside a
  // Latin ring is its own <tspan> and resets it (CSS).
  const tracking = opts.arabicPage ? 0 : 0.06;
  let fontSize = opts.arabicPage ? 36 : 23;
  if (opts.ecrin) fontSize *= 0.8;
  const width = estimateEm(text, tracking, opts.arabicPage ? 1 : AR_NAME_SCALE) * fontSize;
  if (width > ARC_BUDGET) fontSize *= ARC_BUDGET / width;
  return { fontSize: Math.round(fontSize * 10) / 10, tracking };
}

export function LetteredBoard({
  message,
  name,
  tone = "sucre",
  image,
  tag,
  children,
  caption,
  animate = "pipe",
  pipeKey,
  pipeDelay,
  lang,
  className,
  style,
}: LetteredBoardProps) {
  const upper = (s: string) => s.toLocaleUpperCase(lang);
  const cleanName = name?.trim();
  const text = cleanName ? `${upper(message)} ${FSI}${upper(cleanName)}${PDI}` : upper(message);
  const arabicPage = lang?.startsWith("ar") ?? false;
  // An Arabic name typed on a FR/EN page gets its own run, tagged lang="ar",
  // so CSS sets it in Lalezar without tracking (never split into letters).
  const arabicName = !!cleanName && !arabicPage && hasArabic(cleanName);
  const { fontSize, tracking } = ringLayout(text, { arabicPage, ecrin: tone === "ecrin" });
  const arcId = `gp-arc-${fnv1a(`${text}|${image?.src ?? ""}|${tone}`).toString(36)}`;

  const vars = {
    "--dash": Math.round(fontSize * 8),
    ...(pipeDelay !== undefined ? { "--pipe-delay": `${pipeDelay}ms` } : {}),
    ...style,
  } as CSSProperties;

  return (
    <figure
      className={cn(styles.board, tone === "ecrin" && styles.ecrin, animate === "pipe" && styles.pipe, className)}
      style={vars}
    >
      <svg className={styles.scallop} viewBox="-40 0 380 446" aria-hidden="true" focusable="false">
        <path d={SCALLOP} />
      </svg>

      <div className={styles.plate}>
        {image && (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            preload={image.priority}
            fetchPriority={image.priority ? "high" : undefined}
            loading={image.priority ? "eager" : undefined}
            sizes={image.sizes ?? "(min-width: 900px) 380px, min(58vw, 300px)"}
            style={image.position ? { objectPosition: image.position } : undefined}
          />
        )}
        {children}
      </div>

      <svg className={styles.ring} viewBox="-40 0 380 446" aria-hidden="true" focusable="false">
        <path id={arcId} d={arabicPage ? ARC_AR : ARC} fill="none" />
        <text key={pipeKey ?? text} fontSize={fontSize} letterSpacing={tracking ? `${tracking}em` : undefined}>
          <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
            {arabicName ? (
              <>
                {`${upper(message)} `}
                <tspan lang="ar" className={styles.arName}>{`${FSI}${cleanName}${PDI}`}</tspan>
              </>
            ) : (
              text
            )}
          </textPath>
        </text>
      </svg>

      {tag && <div className={styles.tag}>{tag}</div>}
      {caption && <figcaption className="sr-only">{caption}</figcaption>}
    </figure>
  );
}

/** Paillette pill for the plate corner: ref code (LTR-isolated) + a word. */
export function RefTag({ refCode, label }: { refCode: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-paillette px-2.5 py-1.5 text-xs leading-none font-medium text-sucre">
      <bdi className="ltr">{refCode}</bdi>
      {label && <span className="text-cuivre">{label}</span>}
    </span>
  );
}
