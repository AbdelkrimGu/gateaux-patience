import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Gateaux Patience | Pâtisserie Artisanale à Sidi Bel Abbès",
    template: "%s | Gateaux Patience",
  },
  description:
    "Gâteaux personnalisés et pâtisseries artisanales à Sidi Bel Abbès, Algérie. Anniversaires, mariages, diplômes. Commandez votre gâteau sur mesure depuis 2018.",
  keywords: [
    "gâteau personnalisé",
    "pâtisserie artisanale",
    "Sidi Bel Abbès",
    "Algérie",
    "gâteau anniversaire",
    "gâteau mariage",
    "cake design",
    "gateaux patience",
    "كعك مخصص",
    "حلويات سيدي بلعباس",
  ],
  authors: [{ name: "Gateaux Patience" }],
  creator: "Gateaux Patience",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    url: SITE_URL,
    siteName: "Gateaux Patience",
    title: "Gateaux Patience | Pâtisserie Artisanale à Sidi Bel Abbès",
    description:
      "Gâteaux personnalisés et pâtisseries artisanales à Sidi Bel Abbès, Algérie.",
    images: [
      {
        url: "/contact/og.jpg",
        width: 1200,
        height: 630,
        alt: "Gateaux Patience - Pâtisserie Artisanale",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gateaux Patience",
    description: "Pâtisserie artisanale à Sidi Bel Abbès, Algérie",
    images: ["/contact/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
