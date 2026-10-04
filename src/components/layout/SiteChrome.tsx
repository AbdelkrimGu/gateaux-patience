import { useTranslations } from "next-intl";
import { Header } from "./Header";
import { Footer } from "./Footer";

/*
  Skip link + Header + <main id="main"> + Footer. Used by the (site) route
  group layout and by the 404 page. Pages render their sections (and their
  own <StickyOrderBar>) as children, without another <main>.
*/
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common");
  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable fixed top-2 z-50 rounded-pill bg-paillette px-4 py-3 text-sucre no-underline start-2"
      >
        {t("skip_to_content")}
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
