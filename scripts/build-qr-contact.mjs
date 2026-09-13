// Generates the business-card QR landing page as plain static HTML:
//   public/qr/{fr,ar,en}.html   (served at /contact, /ar/contact, /en/contact
//                                through the rewrite in src/middleware.ts)
// Why not an App Router page: even a JS-free server component ships ~75 KB of
// Next.js runtime + an RSC payload duplicating the markup. This page is ~3 KB
// gzipped with zero JavaScript, which is what a QR scan on mobile data deserves.
// Runs automatically before `npm run build` (prebuild); output is committed too.
//   node scripts/build-qr-contact.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const contact = JSON.parse(readFileSync(new URL("../src/lib/contact.json", import.meta.url), "utf8"));
const SITE = contact.siteUrl.replace(/\/$/, "");
const LANGS = ["fr", "ar", "en"];

const COPY = {
  fr: {
    title: "Contact | Gâteaux Patience – Gâteaux sur mesure à Sidi Bel Abbès",
    desc: "Commandez votre gâteau personnalisé chez Gâteaux Patience, pâtisserie artisanale à Sidi Bel Abbès depuis 2018. WhatsApp : +213 669 59 28 50, Instagram et Facebook.",
    ogLocale: "fr_DZ",
    eyebrow: "Pâtisserie artisanale · depuis 2018",
    headline: "Votre gâteau sur mesure, en un message",
    sub: "Anniversaires, mariages, tiramisu personnalisé…",
    nav: "Nous contacter",
    wa: "Commander sur WhatsApp",
    waMessage: "Bonjour Gâteaux Patience ! 👋 J'ai scanné votre carte de visite et j'aimerais commander un gâteau.",
    ig: "Nos créations sur Instagram",
    fb: "Suivez-nous sur Facebook",
    home: "Visiter notre site",
    homeMeta: "La galerie de nos gâteaux",
    homeHref: "/",
    location: "Sidi Bel Abbès, Algérie",
  },
  ar: {
    title: "تواصل معنا | Gâteaux Patience – كعكات حسب الطلب في سيدي بلعباس",
    desc: "اطلب كعكتك المخصّصة من Gâteaux Patience، حلويات حرفية في سيدي بلعباس منذ 2018. واتساب: +213 669 59 28 50، إنستغرام وفيسبوك.",
    ogLocale: "ar_DZ",
    eyebrow: "صناعة يدوية · منذ 2018",
    headline: "كعكتك حسب الطلب، برسالة واحدة",
    sub: "أعياد الميلاد، الأعراس، تيراميسو مخصّص…",
    nav: "تواصل معنا",
    wa: "اطلب عبر واتساب",
    waMessage: "السلام عليكم، Gâteaux Patience 👋\nمسحت بطاقة الزيارة الخاصة بكم وأرغب في طلب كعكة.",
    ig: "إبداعاتنا على إنستغرام",
    fb: "تابعنا على فيسبوك",
    home: "زوروا موقعنا",
    homeMeta: "معرض كعكاتنا",
    homeHref: "/ar",
    location: "سيدي بلعباس، الجزائر",
  },
  en: {
    title: "Contact | Gâteaux Patience – Custom Cakes in Sidi Bel Abbès",
    desc: "Order your custom cake from Gâteaux Patience, artisan cake designer in Sidi Bel Abbès, Algeria since 2018. WhatsApp: +213 669 59 28 50, Instagram and Facebook.",
    ogLocale: "en_US",
    eyebrow: "Artisan cake design · since 2018",
    headline: "Your custom cake, one message away",
    sub: "Birthdays, weddings, custom tiramisu…",
    nav: "Contact us",
    wa: "Order on WhatsApp",
    waMessage: "Hello Gâteaux Patience! 👋 I scanned your business card and I'd like to order a cake.",
    ig: "Our creations on Instagram",
    fb: "Follow us on Facebook",
    home: "Visit our website",
    homeMeta: "Browse our cake gallery",
    homeHref: "/en",
    location: "Sidi Bel Abbès, Algeria",
  },
};

const LANG_NAMES = { fr: ["FR", "Français"], ar: ["ع", "العربية"], en: ["EN", "English"] };

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0}
html{background:#141315}
body{
  color:#f6ece4;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Arabic",Tahoma,sans-serif;
  -webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;
  background:radial-gradient(120% 55% at 50% 20%,rgba(201,139,107,.15),transparent 62%),
    radial-gradient(90% 45% at 50% 108%,rgba(158,27,50,.22),transparent 70%),#141315;
}
a{color:inherit;text-decoration:none}
a:focus-visible{outline:2px solid #f0c6a8;outline-offset:3px}

/* One screen, no scroll: the logo is the only flexible element and absorbs
   whatever height is left (svh = viewport with the browser URL bar shown). */
.qc{
  display:flex;flex-direction:column;width:100%;max-width:440px;margin:0 auto;
  height:100vh;height:100svh;
  padding-block:max(12px,env(safe-area-inset-top)) max(6px,env(safe-area-inset-bottom));
  padding-inline:max(20px,env(safe-area-inset-left)) max(20px,env(safe-area-inset-right));
}
.qc-main{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:center}
.qc-hero{flex:0 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;text-align:center}
.qc-hero picture{display:contents}
.qc-logo{flex:0 1 260px;min-height:64px;width:100%;object-fit:contain}
.qc-eyebrow{flex:none;margin-top:6px;font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:#d9a58a;font-weight:600}
[dir=rtl] .qc-eyebrow{letter-spacing:0;font-size:13px}
.qc-title{flex:none;margin-top:6px;font-size:clamp(20px,5.6vw,24px);line-height:1.2;font-weight:700;color:#fff;text-wrap:balance}
.qc-sub{flex:none;margin-top:5px;font-size:14px;line-height:1.4;color:#bfb2aa}

.qc-actions{flex:none;display:flex;flex-direction:column;gap:10px;margin-top:clamp(14px,3svh,26px)}
.qc-btn{
  position:relative;display:flex;align-items:center;gap:14px;min-height:62px;
  padding-block:8px;padding-inline:8px 16px;border-radius:18px;overflow:hidden;
  background:rgba(255,255,255,.055);border:1px solid rgba(217,165,138,.35);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06);
  transition:transform .15s ease,background-color .2s ease,border-color .2s ease;
  animation:qc-in .3s cubic-bezier(.2,.8,.2,1) both;
}
.qc-btn:nth-child(2){animation-delay:.04s}
.qc-btn:nth-child(3){animation-delay:.08s}
.qc-btn:nth-child(4){animation-delay:.12s}
.qc-btn:active{transform:scale(.97)}
@media (hover:hover){.qc-btn:hover{background:rgba(255,255,255,.09);border-color:rgba(217,165,138,.55)}}
.qc-ico{flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:13px;color:#fff}
.qc-ico svg{width:56%;height:56%}
.qc-txt{flex:1;min-width:0;display:flex;flex-direction:column;text-align:start}
.qc-label{font-size:16.5px;font-weight:700;line-height:1.2;color:#fff}
.qc-meta{margin-top:2px;font-size:12.5px;line-height:1.25;color:#b9aca4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Primary action — WhatsApp turns a scan into an order. Bright brand green
   pops on the dark page; dark text keeps contrast above WCAG AA. */
.qc-wa{
  background:linear-gradient(135deg,#3be586 0%,#22c35e 100%);border-color:transparent;
  box-shadow:0 10px 30px -8px rgba(37,211,102,.5),inset 0 1px 0 rgba(255,255,255,.4);
}
@media (hover:hover){.qc-wa:hover{background:linear-gradient(135deg,#4ff093 0%,#27cf66 100%);border-color:transparent}}
.qc-wa .qc-ico{background:rgba(6,32,15,.12);color:#06200f}
.qc-wa .qc-label{color:#06200f;font-size:17.5px}
.qc-wa .qc-meta{color:#0b3a1c;font-weight:600}
.qc-wa::after{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.4) 50%,transparent 62%);
  transform:translateX(-120%);animation:qc-shine 1.4s ease-in-out .9s 2;
}
.qc-ig .qc-ico{background:radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285aeb 90%)}
.qc-fb .qc-ico{background:#1877f2}
.qc-home .qc-ico{background:linear-gradient(135deg,#e2b08f,#b87556);color:#1b1416}

.qc-foot{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;font-size:12.5px;color:#9d918a}
.qc-loc{display:flex;align-items:center;gap:5px;min-width:0}
.qc-loc svg{flex:none;width:14px;height:14px;color:#d9a58a}
.qc-lang{display:flex}
.qc-lang a{display:grid;place-items:center;min-width:44px;min-height:44px;padding:0 6px;border-radius:10px;font-weight:600}
.qc-lang a[aria-current]{color:#f6ece4;background:rgba(255,255,255,.08)}

@keyframes qc-in{from{transform:translateY(6px)}}
@keyframes qc-shine{to{transform:translateX(120%)}}

@media (min-height:760px){.qc-logo{flex-basis:300px}}
@media (max-height:640px){
  .qc-sub{display:none}
  .qc-actions{gap:8px}
  .qc-btn{min-height:52px;padding-block:4px}
  .qc-ico{width:40px;height:40px}
}
@media (max-height:540px){
  .qc-eyebrow,.qc-meta{display:none}
  .qc-title{font-size:18px;margin-top:2px}
  .qc-btn{min-height:48px}
  .qc-ico{width:36px;height:36px;border-radius:11px}
  .qc-lang a{min-height:40px}
}
@media (prefers-reduced-motion:reduce){
  .qc-btn{animation:none;transition:none}
  .qc-wa::after{display:none}
}
`;

const minify = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const svg = (attrs, body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" ${attrs}>${body}</svg>`;
const ICON = {
  wa: svg('fill="currentColor"', '<path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9a11.82 11.82 0 0 0-3.48-8.41"/>'),
  ig: svg('fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"', '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".6" fill="currentColor" stroke="none"/>'),
  fb: svg('fill="currentColor"', '<path d="M13.4 21v-7.7h2.6l.4-3.1h-3V8.3c0-.9.3-1.5 1.5-1.5h1.6V4.1c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.7v3.1h2.6V21h3.1z"/>'),
  home: svg('fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"', '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>'),
  pin: svg('fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"', '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
};

const publicPath = (l) => (l === "fr" ? "/contact" : `/${l}/contact`);

const button = (cls, href, icon, label, meta) =>
  `<a class="qc-btn ${cls}" href="${esc(href)}"><span class="qc-ico">${icon}</span><span class="qc-txt"><span class="qc-label">${esc(label)}</span><span class="qc-meta">${meta}</span></span></a>`;

function page(lang) {
  const c = COPY[lang];
  const waHref = `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(c.waMessage)}`;
  const ltr = (s) => `<bdi dir="ltr">${esc(s)}</bdi>`;
  const url = `${SITE}${publicPath(lang)}`;
  const alternates =
    LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${publicPath(l)}">`).join("") +
    `<link rel="alternate" hreflang="x-default" href="${SITE}/contact">`;

  // schema.org structured data: lets Google tie this page to the business
  // (local results / knowledge panel): name, phone, city, official socials.
  // Only verified facts — no opening hours or prices until the owner confirms.
  const tel = `+${contact.whatsapp.replace(/\D/g, "")}`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Bakery",
        "@id": `${SITE}/#business`,
        name: "Gâteaux Patience",
        alternateName: ["Gateaux Patience", "Gâteaux patience"],
        description: COPY.fr.desc,
        url: `${SITE}/`,
        logo: `${SITE}/contact/logo-square.jpg`,
        image: `${SITE}/contact/og.jpg`,
        telephone: tel,
        foundingDate: contact.founded,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Sidi Bel Abbès",
          addressRegion: "Sidi Bel Abbès",
          addressCountry: "DZ",
        },
        areaServed: { "@type": "City", name: "Sidi Bel Abbès" },
        sameAs: [contact.instagram, contact.facebook],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: tel,
          contactType: "customer service",
          availableLanguage: ["French", "Arabic", "English"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: `${SITE}/`,
        name: "Gâteaux Patience",
        publisher: { "@id": `${SITE}/#business` },
      },
      {
        "@type": "ContactPage",
        "@id": `${url}#webpage`,
        url,
        name: c.title,
        description: c.desc,
        inLanguage: lang,
        isPartOf: { "@id": `${SITE}/#website` },
        about: { "@id": `${SITE}/#business` },
        primaryImageOfPage: `${SITE}/contact/og.jpg`,
      },
    ],
  }).replace(/</g, "\\u003c");
  const langLinks = LANGS.map(
    (l) =>
      `<a href="/${l}/contact" hreflang="${l}" lang="${l}" aria-label="${LANG_NAMES[l][1]}"${l === lang ? ' aria-current="page"' : ""}>${LANG_NAMES[l][0]}</a>`
  ).join("");

  return `<!doctype html>
<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.desc)}">
<meta name="theme-color" content="#141315">
<link rel="icon" href="/icon.png" type="image/png">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="${url}">${alternates}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Gâteaux Patience">
<meta property="og:title" content="${esc(c.title)}">
<meta property="og:description" content="${esc(c.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${c.ogLocale}">
${LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${COPY[l].ogLocale}">`).join("")}
<meta property="og:image" content="${SITE}/contact/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Gâteaux Patience">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(c.title)}">
<meta name="twitter:description" content="${esc(c.desc)}">
<meta name="twitter:image" content="${SITE}/contact/og.jpg">
<script type="application/ld+json">${jsonLd}</script>
<style>${minify(CSS)}</style>
</head>
<body>
<main class="qc">
<div class="qc-main">
<header class="qc-hero">
<picture><source type="image/avif" srcset="/contact/logo-360.avif 360w,/contact/logo-720.avif 720w" sizes="360px"><img class="qc-logo" src="/contact/logo-360.webp" srcset="/contact/logo-360.webp 360w,/contact/logo-720.webp 720w" sizes="360px" width="944" height="660" alt="Gâteaux Patience" fetchpriority="high"></picture>
<p class="qc-eyebrow">${esc(c.eyebrow)}</p>
<h1 class="qc-title">${esc(c.headline)}</h1>
<p class="qc-sub">${esc(c.sub)}</p>
</header>
<nav class="qc-actions" aria-label="${esc(c.nav)}">
${button("qc-wa", waHref, ICON.wa, c.wa, ltr(contact.phone))}
${button("qc-ig", contact.instagram, ICON.ig, c.ig, ltr(contact.instagramHandle))}
${button("qc-fb", contact.facebook, ICON.fb, c.fb, ltr(contact.facebookName))}
${button("qc-home", c.homeHref, ICON.home, c.home, esc(c.homeMeta))}
</nav>
</div>
<footer class="qc-foot"><span class="qc-loc">${ICON.pin}${esc(c.location)}</span><span class="qc-lang">${langLinks}</span></footer>
</main>
</body>
</html>
`;
}

const outDir = new URL("../public/qr/", import.meta.url);
mkdirSync(outDir, { recursive: true });
for (const lang of LANGS) {
  writeFileSync(new URL(`${lang}.html`, outDir), page(lang));
}
console.log(`qr contact pages written (${LANGS.join(", ")}) for ${SITE}`);
