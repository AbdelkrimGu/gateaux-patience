import Image from "next/image";
import { cn } from "@/lib/utils";

export interface PrintProps {
  src: string;
  alt: string;
  /** Real rendered width, e.g. "(min-width: 768px) 280px, 42vw". Required: no 100vw defaults. */
  sizes: string;
  /** Fixed rotation in degrees (−4…4). Never random: it must match server and client. */
  rotate?: number;
  /** CSS aspect-ratio of the photo window. */
  aspect?: string;
  /** Keep the cake top in frame / dodge watermarks. */
  objectPosition?: string;
  /** Only for the true LCP image. */
  priority?: boolean;
  /** Small caption on the cream border (polaroid style). */
  caption?: React.ReactNode;
  /** "print" = thin even border; "polaroid" = thicker bottom border for a caption. */
  frame?: "print" | "polaroid";
  className?: string;
  imageClassName?: string;
}

/** A photo printed on cream paper: border, rounded corners, fixed tilt, long soft shadow. */
export default function Print({
  src,
  alt,
  sizes,
  rotate = 0,
  aspect = "4 / 5",
  objectPosition = "50% 40%",
  priority = false,
  caption,
  frame = "print",
  className,
  imageClassName,
}: PrintProps) {
  return (
    <figure
      className={cn(
        "gp-print rounded-[18px] bg-gp-cream p-1.5 text-gp-ink md:p-2.5",
        frame === "polaroid" && "pb-3 md:pb-4",
        className
      )}
      style={rotate ? { rotate: `${rotate}deg` } : undefined}
    >
      <div
        className="relative overflow-hidden rounded-[12px] bg-gp-champagne/60"
        style={{ aspectRatio: aspect }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imageClassName)}
          style={{ objectPosition }}
        />
      </div>
      {caption ? (
        <figcaption className="px-1 pt-2 text-center font-note text-[1.15rem] font-semibold leading-tight text-gp-ink/80 md:text-[1.3rem]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
