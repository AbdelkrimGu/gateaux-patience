import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "../globals.css";

// Same display + text voices as the public site (Latin only: the admin is French).
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});
const text = Geist({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: { absolute: "Admin | Gateaux Patience" },
  robots: { index: false, follow: false },
};

// The phone's browser chrome matches the ink top bar.
export const viewport: Viewport = {
  themeColor: "#241618",
  // Full-bleed on notched phones; the ink bars and the login pad themselves with env(safe-area-inset-*).
  viewportFit: "cover",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`gp-admin ${display.variable} ${text.variable}`}>
      <body className="bg-gp-cream font-text text-gp-ink antialiased">{children}</body>
    </html>
  );
}
