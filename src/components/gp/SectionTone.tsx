import { cn } from "@/lib/utils";

/** The four section tones of the signature UI (tokens.md). */
export type Tone = "cream" | "raspberry" | "ink" | "champagne";

type ToneTag = "section" | "div" | "article" | "aside" | "header" | "footer";

export interface SectionToneProps extends React.HTMLAttributes<HTMLElement> {
  tone?: Tone;
  as?: ToneTag;
}

/**
 * A section painted in one tone. Sets `data-tone` (read by the chameleon
 * header and by every `tone-*` utility inside: text-tone-accent, bg-tone-cta-bg…).
 */
export default function SectionTone({
  tone = "cream",
  as: Tag = "section",
  className,
  children,
  ...rest
}: SectionToneProps) {
  return (
    <Tag data-tone={tone} className={cn("bg-tone-bg text-tone-fg", className)} {...rest}>
      {children}
    </Tag>
  );
}
