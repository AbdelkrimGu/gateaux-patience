import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./admin.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin | Gateaux Patience",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth: proxy.ts guards every /admin page except /admin/login, and each
  // page/API route re-checks with isAdmin()/requireAdmin() (src/lib/admin-auth.ts).
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
