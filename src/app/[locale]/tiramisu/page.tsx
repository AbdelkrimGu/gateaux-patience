import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TiramisuHero from "@/components/tiramisu/TiramisuHero";
import TiramisuConfigurator from "@/components/tiramisu/TiramisuConfigurator";

const META: Record<string, { title: string; desc: string }> = {
  fr: {
    title: "Tiramisu Personnalisé | Gateaux Patience",
    desc: "Composez votre tiramisu : écrivez votre message au cacao ou en lettres de chocolat blanc, et visualisez le résultat en direct. Sidi Bel Abbès.",
  },
  ar: {
    title: "تيراميسو مخصّص | Gateaux Patience",
    desc: "صمّم تيراميسو الخاص بك: اكتب رسالتك بالكاكاو أو بحروف الشوكولاتة البيضاء، وشاهد النتيجة مباشرة.",
  },
  en: {
    title: "Custom Tiramisu | Gateaux Patience",
    desc: "Build your tiramisu: write your message in cacao or white-chocolate letters and preview it live. Sidi Bel Abbès.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] ?? META.fr;
  return { title: m.title, description: m.desc };
}

export default async function TiramisuPage() {
  return (
    <main>
      <Header />

      <TiramisuHero />

      {/* ---- Configurator ---- */}
      <section id="composer" className="section-padding bg-background">
        <div className="container-custom">
          <TiramisuConfigurator />
        </div>
      </section>

      <Footer />
    </main>
  );
}
