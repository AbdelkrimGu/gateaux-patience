import FooterBody from "./FooterBody";
import WordmarkRise from "./WordmarkRise";
import { cn } from "@/lib/utils";

/**
 * Static ink footer ending with the logo's script wordmark set huge in gold,
 * cropped by the bottom edge. Pairs with a non-curtain page (SiteFrame footer="wordmark").
 */
export default function WordmarkFooter({
  showTagline = true,
  showCta = true,
  className,
}: {
  showTagline?: boolean;
  showCta?: boolean;
  className?: string;
}) {
  return (
    <footer
      data-tone="ink"
          data-header-tone="ink"
      data-final-cta
      className={cn("relative z-0 -mt-10 overflow-hidden bg-gp-ink pt-20 text-gp-cream md:pt-28", className)}
    >
      <FooterBody showTagline={showTagline} showCta={showCta} />
      <div className="mt-10 md:mt-14">
        <WordmarkRise />
      </div>
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </footer>
  );
}
