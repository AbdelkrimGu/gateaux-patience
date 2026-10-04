import type { SweetType } from "@/lib/whatsapp";

/*
  One drawn motif per sweet type for "La carte des douceurs". Illustrations,
  not photos: light fills with a 3px piping-colour outline (the card's
  `--piping` / `--tint`), on a 96 grid. Decorative (aria-hidden); the tile's
  text carries the meaning. No per-motif ids, so they can repeat on a page.
*/

const STROKE = {
  fill: "none",
  stroke: "var(--piping, var(--color-framboise))",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
// Shapes sit on the tile's tint: fill them light so they read.
const OUTLINE = { ...STROKE, fill: "var(--color-white)" };
const CREAM = { ...STROKE, fill: "var(--color-sucre)" };

function Cupcake() {
  return (
    <>
      {/* wrapper + pleats */}
      <path d="M24 54 H72 L65 86 H31 Z" {...OUTLINE} />
      <path d="M36 56 L39 84 M48 56 V84 M60 56 L57 84" {...STROKE} strokeWidth={2.5} />
      {/* frosting swirl */}
      <path
        d="M20 54 C14 46 22 38 30 41 C28 31 39 26 46 31 C52 24 66 28 64 39 C73 37 80 47 74 54 Z"
        {...CREAM}
      />
      <path d="M33 47 C40 42 54 42 62 47" {...STROKE} strokeWidth={2.5} />
      {/* cherry */}
      <circle cx="48" cy="20" r="6" fill="var(--piping, var(--color-framboise))" />
      <path d="M48 14 C49 9 53 7 57 7" {...STROKE} strokeWidth={2.5} />
    </>
  );
}

function CakePop() {
  return (
    <>
      <path d="M48 58 V90" {...STROKE} strokeWidth={4} />
      <circle cx="48" cy="36" r="23" {...OUTLINE} />
      {/* chocolate drizzle */}
      <path d="M28 28 L35 38 L41 25 L48 38 L55 25 L61 38 L68 28" {...STROKE} />
      <circle cx="38" cy="48" r="2.2" fill="var(--piping, var(--color-framboise))" />
      <circle cx="49" cy="51" r="2.2" fill="var(--piping, var(--color-framboise))" />
      <circle cx="59" cy="47" r="2.2" fill="var(--piping, var(--color-framboise))" />
    </>
  );
}

function Cakesicle() {
  return (
    <>
      <rect x="42" y="64" width="12" height="26" rx="4" {...CREAM} />
      <rect x="27" y="8" width="42" height="60" rx="21" {...OUTLINE} />
      {/* dipped top edge */}
      <path d="M28 30 C34 36 38 28 44 33 C50 38 55 29 61 34 C64 36 66 34 68 32" {...STROKE} />
      {/* a heart, like the ones piped on her cakes */}
      <path
        d="M48 56 C40 50 36 46 37 42 C38 38 44 37 48 42 C52 37 58 38 59 42 C60 46 56 50 48 56 Z"
        fill="var(--piping, var(--color-framboise))"
      />
    </>
  );
}

function Dessert() {
  return (
    <>
      {/* verrine: layers, then the glass on top */}
      <path d="M31 50 C38 46 44 54 50 50 C56 46 61 52 65 50 L63 70 H33 Z" fill="color-mix(in srgb, var(--piping, var(--color-framboise)) 28%, white)" />
      <path d="M33 70 H63 L62 80 Q48 88 34 80 Z" fill="var(--piping, var(--color-framboise))" />
      <path d="M31 50 C38 46 44 54 50 50 C56 46 61 52 65 50" {...STROKE} />
      <path d="M28 22 H68 L62 80 Q48 88 34 80 Z" {...STROKE} />
      {/* cream + spoon */}
      <path d="M33 36 C36 28 44 32 48 27 C52 32 60 28 63 36 Z" {...CREAM} />
      <path d="M66 8 L57 30" {...STROKE} />
      <ellipse cx="68" cy="7" rx="3.5" ry="5" transform="rotate(22 68 7)" {...CREAM} />
    </>
  );
}

const MOTIFS: Record<SweetType, () => React.JSX.Element> = {
  cupcakes: Cupcake,
  cake_pops: CakePop,
  cakesicles: Cakesicle,
  desserts: Dessert,
};

export function SweetMotif({ type, className }: { type: SweetType; className?: string }) {
  const Motif = MOTIFS[type];
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false">
      <Motif />
    </svg>
  );
}
