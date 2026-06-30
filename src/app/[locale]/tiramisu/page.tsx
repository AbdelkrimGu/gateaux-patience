import type { Metadata } from "next";
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

const HERO = {
  badge: {
    fr: "Nouveau · Atelier Tiramisu",
    ar: "جديد · ورشة التيراميسو",
    en: "New · Tiramisu Workshop",
  },
  title: { fr: "Un Tiramisu", ar: "تيراميسو", en: "A Tiramisu" },
  accent: { fr: "À Votre Nom", ar: "باسمك أنت", en: "With Your Name" },
  sub: {
    fr: "Crémeux, généreusement saupoudré de cacao, et signé de votre main. Écrivez un prénom, un âge, un message — et regardez-le prendre vie avant même de commander.",
    ar: "كريمي، مغطّى بسخاء بالكاكاو، وموقّع بيدك. اكتب اسمًا أو عمرًا أو رسالة — وشاهده يتحقّق قبل أن تطلب.",
    en: "Creamy, generously dusted with cacao, and signed by you. Write a name, an age, a message — and watch it come alive before you even order.",
  },
  cta: { fr: "Composer le mien", ar: "صمّم نسختي", en: "Design mine" },
};

export default async function TiramisuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRTL = locale === "ar";
  const L = (o: Record<string, string>) => o[locale] ?? o.fr;

  return (
    <div>
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden bg-charcoal pt-28 pb-20 text-cream md:pt-36 md:pb-28">
        {/* warm cacao glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(212,175,55,0.18) 0%, transparent 60%), radial-gradient(80% 80% at 50% 120%, rgba(120,79,48,0.55) 0%, transparent 70%)",
          }}
        />
        <div className="container-custom relative">
          <div
            className={`mx-auto flex max-w-2xl flex-col ${
              isRTL ? "items-center text-center" : "items-center text-center"
            }`}
          >
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold">
              {L(HERO.badge)}
            </span>
            <h1 className="font-playfair text-4xl font-bold leading-tight md:text-6xl">
              {L(HERO.title)}{" "}
              <span className="bg-gradient-to-r from-gold-light to-gold bg-clip-text text-transparent">
                {L(HERO.accent)}
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/80 md:text-lg">
              {L(HERO.sub)}
            </p>
            <a
              href="#composer"
              className="btn-gold mt-8 text-base"
            >
              {L(HERO.cta)}
            </a>
          </div>
        </div>
      </section>

      {/* ---- Configurator ---- */}
      <section id="composer" className="section-padding bg-background">
        <div className="container-custom">
          <TiramisuConfigurator />
        </div>
      </section>
    </div>
  );
}
