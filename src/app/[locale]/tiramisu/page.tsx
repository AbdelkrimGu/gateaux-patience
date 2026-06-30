import type { Metadata } from "next";
import TiramisuWizard from "@/components/tiramisu/TiramisuWizard";

const META: Record<string, { title: string; desc: string }> = {
  fr: {
    title: "Tiramisu Personnalisé | Gateaux Patience",
    desc: "Commandez votre tiramisu : boîtes gourmandes ou personnalisées, écrivez votre message et visualisez le résultat en direct. Sidi Bel Abbès.",
  },
  ar: {
    title: "تيراميسو مخصّص | Gateaux Patience",
    desc: "اطلب تيراميسو الخاص بك: علب لذيذة أو مخصّصة، اكتب رسالتك وشاهد النتيجة مباشرة.",
  },
  en: {
    title: "Custom Tiramisu | Gateaux Patience",
    desc: "Order your tiramisu: gourmet or personalized boxes, write your message and preview it live. Sidi Bel Abbès.",
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

export default function TiramisuPage() {
  return <TiramisuWizard />;
}
