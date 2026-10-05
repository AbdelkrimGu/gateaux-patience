import Image from "next/image";
import glyphs from "@/lib/tiramisu-glyphs.json";
import { SWEETS_CARD_IMAGE, TIRAMISU_CARD_IMAGE, type Universe } from "./model";

/*
  The picture of a universe, filling its (positioned) parent. Hook-free,
  server-rendered, used by the home gate cards and the cross-sell cards.

  - cakes:    a real cake photo (the gallery's lead photo on the gate).
  - sweets:   the owner's real cakesicles photo (SWEETS_CARD_IMAGE).
  - tiramisu: the real cocoa top with the white-chocolate letter sprites of
              the customizer, spelling the same sample word as the /tiramisu
              stage (Latin letters in every locale: DESIGN.md amendment 8).
              Static here: letters landing is the tiramisu page's moment.
*/

const GLYPHS = (glyphs as { glyphs: Record<string, { file: string; aspect: number }> }).glyphs;
const LETTER_H = 48;

/** The princess cake (Cake7): used when no catalogue photo is passed. */
export const DEFAULT_CAKES_IMAGE = { src: "/images/Cake7/FB_IMG_1778413136978.jpg", position: "50% 48%" };

export interface UniverseImageProps {
  universe: Universe;
  sizes: string;
  /** cakes only: the photo to show (defaults to DEFAULT_CAKES_IMAGE). */
  cakes?: { src: string; position?: string };
  /** tiramisu only: the word in letters (tiramisuUi.mode.sample). */
  word?: string;
  priority?: boolean;
  /** "eager" for pictures in the first viewport that are not the LCP. */
  loading?: "eager" | "lazy";
}

export function UniverseImage({ universe, sizes, cakes, word = "BRAVO", priority, loading }: UniverseImageProps) {
  if (universe === "tiramisu") {
    const chars = [...word.toUpperCase()].filter((c) => GLYPHS[c]).slice(0, 8);
    const sumAspect = chars.reduce((n, c) => n + GLYPHS[c].aspect, 0) || 1;
    return (
      <>
        <Image
          src={TIRAMISU_CARD_IMAGE.src}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : loading}
          className="scale-[1.3] object-cover"
        />
        {/* The parent is a size container (gate + cross-sell CSS): letters
            take at most 26% of its height and 76% of its width. */}
        <span
          dir="ltr"
          className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-end justify-center gap-[1.5cqw]"
          style={{ height: `min(26cqh, ${(66 / (sumAspect + chars.length * 0.02)).toFixed(2)}cqw)` }}
        >
          {chars.map((c, i) => (
            <Image
              key={`${i}-${c}`}
              src={`/images/tiramisu/letters/${GLYPHS[c].file}`}
              alt=""
              // Drawn ~40px tall (CSS sets the size). Intrinsic 48px and no
              // `sizes`: a 1x/2x srcset of two URLs instead of sixteen, in the
              // <img> and in React's auto-preload <link> (home HTML weight).
              width={Math.round(LETTER_H * GLYPHS[c].aspect)}
              height={LETTER_H}
              loading={loading}
              className="h-full w-auto drop-shadow-[0_2px_1.5px_rgb(34_19_9/0.55)]"
            />
          ))}
        </span>
      </>
    );
  }
  const img = universe === "sweets" ? SWEETS_CARD_IMAGE : (cakes ?? DEFAULT_CAKES_IMAGE);
  return (
    <Image
      src={img.src}
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : loading}
      className="photo-grade object-cover"
      style={{ objectPosition: img.position ?? "50% 45%" }}
    />
  );
}
