import { getNavCategories } from "@/lib/home-data";
import { cn } from "@/lib/utils";
import SiteHeader from "./header/SiteHeader";
import CurtainFooter from "./footer/CurtainFooter";
import FooterBody from "./footer/FooterBody";
import WordmarkFooter from "./footer/WordmarkFooter";

export interface SiteFrameProps {
  locale: string;
  children: React.ReactNode;
  /** "curtain" (lifted main over a fixed footer) · "wordmark" (giant script) · "static" (plain ink footer). */
  footer?: "curtain" | "wordmark" | "static";
  /** Header transparent over the first section until scrolled (needs a hero). */
  overlay?: boolean;
  /** Mobile sticky order pill. Off for app-like pages (tiramisu). */
  pill?: "auto" | "off";
  /** Extra classes on <main> (e.g. a page background). */
  mainClassName?: string;
  /** Footer order CTA (off when the page already ends on a CTA section). */
  footerCta?: boolean;
}

/**
 * The public page frame: skip link target, chameleon header, `<main id="main">`
 * lifted with a rounded bottom over the chosen footer. Fetches the header's
 * gallery categories itself (cached per request with the home data).
 */
export default async function SiteFrame({
  locale,
  children,
  footer = "static",
  overlay = true,
  pill = "auto",
  mainClassName,
  footerCta = true,
}: SiteFrameProps) {
  const categories = await getNavCategories(locale);

  return (
    <>
      <div id="top" />
      <SiteHeader categories={categories} overlay={overlay} pill={pill} />
      <main
        id="main"
        tabIndex={-1}
        className={cn(
          "relative z-10 overflow-clip rounded-b-[32px] bg-gp-cream shadow-gp-lifted outline-none md:rounded-b-[40px]",
          mainClassName
        )}
      >
        {children}
      </main>
      {footer === "curtain" ? (
        <CurtainFooter>
          <FooterBody />
        </CurtainFooter>
      ) : footer === "wordmark" ? (
        <WordmarkFooter showCta={footerCta} />
      ) : (
        <footer
          data-tone="ink"
          data-final-cta
          className="relative z-0 -mt-10 bg-gp-ink pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-20 text-gp-cream md:pt-28"
        >
          <FooterBody />
        </footer>
      )}
    </>
  );
}
