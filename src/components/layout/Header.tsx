"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Globe, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/constants";

const locales = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇩🇿" },
];

export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const isRTL = locale === "ar";

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/galerie", label: t("gallery") },
    { href: "/a-propos", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  function getLocalizedPath(newLocale: string) {
    // Remove current locale prefix and add new one
    const segments = pathname.split("/").filter(Boolean);
    if (["fr", "ar", "en"].includes(segments[0])) {
      segments.shift();
    }
    if (newLocale === "fr") {
      return "/" + segments.join("/");
    }
    return `/${newLocale}/${segments.join("/")}`;
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "glass shadow-sm py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale === "fr" ? "" : locale}`} className="flex items-center shrink-0">
          <span className="font-script text-3xl md:text-4xl text-rose leading-none">
            Gateaux Patience
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className={cn("hidden md:flex items-center gap-1", isRTL && "flex-row-reverse")}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={locale === "fr" ? link.href : `/${locale}${link.href}`}
              className="px-4 py-2 rounded-full text-sm font-medium text-charcoal-light hover:text-rose hover:bg-rose/5 transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className={cn("hidden md:flex items-center gap-2", isRTL && "flex-row-reverse")}>
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-charcoal-light hover:text-rose hover:bg-rose/5 transition-all duration-200"
            >
              <Globe size={15} />
              <span className="uppercase">{locale}</span>
            </button>
            {langOpen && (
              <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-cake border border-border py-1 min-w-[140px] z-50">
                {locales.map((loc) => (
                  <button
                    key={loc.code}
                    onClick={() => {
                      router.push(getLocalizedPath(loc.code));
                      setLangOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-rose/5 transition-colors",
                      locale === loc.code ? "text-rose font-medium" : "text-charcoal"
                    )}
                  >
                    <span>{loc.flag}</span>
                    <span>{loc.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <a
            href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm"
          >
            <Phone size={14} />
            {t("order")}
          </a>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 rounded-xl text-charcoal hover:bg-rose/5 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-border shadow-lg">
          <nav className="container-custom py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={locale === "fr" ? link.href : `/${locale}${link.href}`}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-charcoal hover:text-rose hover:bg-rose/5 transition-all"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border mt-2 flex items-center gap-2 flex-wrap">
              {locales.map((loc) => (
                <button
                  key={loc.code}
                  onClick={() => {
                    router.push(getLocalizedPath(loc.code));
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    locale === loc.code
                      ? "bg-rose text-white border-rose"
                      : "border-border text-charcoal-light hover:border-rose hover:text-rose"
                  )}
                >
                  {loc.flag} {loc.label}
                </button>
              ))}
            </div>
            <a
              href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary justify-center mt-2"
              onClick={() => setMobileOpen(false)}
            >
              <Phone size={14} />
              {t("order")}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
