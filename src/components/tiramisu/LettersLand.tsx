import Image from "next/image";
import manifest from "@/lib/tiramisu-glyphs.json";
import { cn } from "@/lib/utils";
import s from "./tiramisu.module.css";

/*
  The /tiramisu signature (direction-b §8, "letters land in the cocoa"):
  a photo of a real cocoa top with white-chocolate letter sprites dropping
  onto it one by one. A static sample, an overlay of <img>s: it never goes
  through the canvas/3D engines. Hook-free. Under reduced motion the word is
  simply there.
*/

const GLYPHS = (manifest as { glyphs: Record<string, { file: string; aspect: number }> }).glyphs;
const SPRITE_H = 171; // the sprites' native height (px); width follows aspect

export function LettersLand({
  word,
  label,
  className,
  priority,
}: {
  /** Latin A–Z / 0–9 only (other characters are skipped). */
  word: string;
  label: string;
  className?: string;
  priority?: boolean;
}) {
  const chars = [...word.toUpperCase()].filter((c) => GLYPHS[c]);
  const sumAspect = chars.reduce((n, c) => n + GLYPHS[c].aspect, 0) || 1;
  // Letter height as a share of the tile: as big as fits in ~80% of its width.
  const h = Math.min(0.24, 0.8 / (sumAspect * 1.04));

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative aspect-square overflow-hidden rounded-[28px] bezel", className)}
    >
      <Image
        src="/images/tiramisu/boxes/cust-square.png"
        alt=""
        fill
        priority={priority}
        sizes="(min-width: 900px) 280px, 62vw"
        className="scale-[1.2] object-cover"
      />
      <div
        className={cn(s.word, "absolute inset-x-0 top-1/2 -translate-y-1/2")}
        style={{ height: `${h * 100}%` }}
      >
        {chars.map((c, i) => (
          <span key={i} className={s.letter} style={{ ["--i" as string]: i }}>
            <Image
              src={`/images/tiramisu/letters/${GLYPHS[c].file}`}
              alt=""
              width={Math.round(SPRITE_H * GLYPHS[c].aspect)}
              height={SPRITE_H}
              sizes="48px"
              loading={priority ? "eager" : "lazy"}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
