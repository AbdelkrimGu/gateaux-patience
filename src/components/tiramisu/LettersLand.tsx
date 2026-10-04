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
  surface = "box",
  sizes = "(min-width: 900px) 280px, 62vw",
}: {
  /** Latin A–Z / 0–9 only (other characters are skipped). */
  word: string;
  label: string;
  className?: string;
  priority?: boolean;
  /**
   * "box": a square boxed tiramisu tile (the /tiramisu stage).
   * "cocoa": bare cocoa texture that fills its parent (e.g. a plate, the 404).
   */
  surface?: "box" | "cocoa";
  sizes?: string;
}) {
  const chars = [...word.toUpperCase()].filter((c) => GLYPHS[c]);
  const sumAspect = chars.reduce((n, c) => n + GLYPHS[c].aspect, 0) || 1;
  // Letter height as a share of the tile: as big as fits in ~80% of its width
  // (the cocoa surface fills a 3:4 plate, so its width is 0.75 × its height).
  const widthRatio = surface === "cocoa" ? 0.75 : 1;
  const h = Math.min(0.24, (0.8 * widthRatio) / (sumAspect * 1.04));
  const box = surface === "box";

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative overflow-hidden",
        box ? "aspect-square rounded-[28px] bezel" : "absolute inset-0",
        className
      )}
    >
      <Image
        src={box ? "/images/tiramisu/boxes/cust-square.png" : "/images/tiramisu/base/cacao.png"}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", box && "scale-[1.2]")}
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
