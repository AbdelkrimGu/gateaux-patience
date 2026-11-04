import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "../globals.css";

// Same display + text voices as the public site (gp-signature-ui); the admin
// is French only, so the Latin pair is enough.
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
  // absolute: the root template would add a second "| Gateaux Patience".
  title: { absolute: "Admin | Gateaux Patience" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#F8F2E9",
  // Edge to edge when added to the home screen: the top bar, the tab bar and
  // the login pad themselves with env(safe-area-inset-*).
  viewportFit: "cover",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`gp-admin ${display.variable} ${text.variable}`}>
      <body className="bg-gp-cream text-gp-ink antialiased">{children}</body>
    </html>
  );
}
