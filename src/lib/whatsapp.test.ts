import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppMessage, buildWhatsAppUrl, occasionOfCategory } from "./whatsapp";
import { cakeRef, assertUniqueRefs, REF_ALPHABET } from "./cake-ref";
import { pipingFor, occasionFor } from "./piping";

const FSI = "⁨";
const PDI = "⁩";

test("general FR message asks for date and guests", () => {
  const msg = buildWhatsAppMessage({ locale: "fr", kind: "general" });
  assert.equal(
    msg,
    [
      "Bonjour Gateaux Patience !",
      "Je voudrais commander un gâteau personnalisé.",
      "Date de l’événement : …",
      "Nombre d’invités : …",
    ].join("\n")
  );
});

test("cake FR message carries title, ref, brief and absolute link", () => {
  const msg = buildWhatsAppMessage({
    locale: "fr",
    kind: "cake",
    cake: { title: " Tarte Minecraft ", ref: "GP-3K7Q" },
    name: "  Ines ",
    date: "2026-11-02",
    guests: 20,
    page: "/galerie/tarte-minecraft",
  });
  const lines = msg.split("\n");
  assert.equal(lines[1], "Je voudrais un gâteau comme « Tarte Minecraft » (réf. GP-3K7Q).");
  assert.equal(lines[2], "Prénom à écrire : Ines");
  assert.equal(lines[3], "Date de l’événement : 2 novembre 2026");
  assert.equal(lines[4], "Nombre d’invités : 20");
  assert.equal(lines[5], "Vu ici : https://gateauxpatience.com/galerie/tarte-minecraft");
});

test("cake kind without a cake falls back to general", () => {
  const msg = buildWhatsAppMessage({ locale: "en", kind: "cake" });
  assert.match(msg, /^Hello Gateaux Patience!\nI would like to order a custom cake\./);
});

test("AR isolates Latin values and keeps Western digits", () => {
  const msg = buildWhatsAppMessage({
    locale: "ar",
    kind: "cake",
    cake: { title: "Tarte Minecraft", ref: "GP-3K7Q" },
    name: "Youta",
    date: "2026-11-02",
    guests: 12,
  });
  assert.ok(msg.includes(`${FSI}GP-3K7Q${PDI}`), "ref isolated");
  assert.ok(msg.includes(`الاسم المراد كتابته: ${FSI}Youta${PDI}`));
  assert.ok(msg.includes("2026") && !/[٠-٩]/.test(msg), "western digits");
  assert.ok(msg.includes(`عدد الضيوف: ${FSI}12${PDI}`));
});

test("page paths get the locale prefix (none for FR)", () => {
  const last = (locale: string, page: string) =>
    buildWhatsAppMessage({ locale, kind: "general", page }).split("\n").pop();
  assert.equal(last("en", "/galerie/x"), "Seen here: https://gateauxpatience.com/en/galerie/x");
  assert.equal(last("en", "/"), "Seen here: https://gateauxpatience.com/en");
  assert.equal(last("fr", "/"), "Vu ici : https://gateauxpatience.com/");
  assert.ok(last("ar", "/tiramisu")!.includes("https://gateauxpatience.com/ar/tiramisu"));
});

test("AR link is never wrapped in FSI/PDI (linkifiers would eat U+2069)", () => {
  const last = buildWhatsAppMessage({ locale: "ar", kind: "general", page: "/galerie/gateau-cocomelon" })
    .split("\n")
    .pop()!;
  assert.equal(last, "شاهدتها هنا: https://gateauxpatience.com/ar/galerie/gateau-cocomelon");
  assert.ok(!last.includes(FSI) && !last.includes(PDI));
});

test("general messages can carry an occasion or a gallery category", () => {
  const line = (o: Parameters<typeof buildWhatsAppMessage>[0]) => buildWhatsAppMessage(o).split("\n")[1];
  assert.equal(
    line({ locale: "fr", kind: "general", category: "wedding" }),
    "Je voudrais commander un gâteau pour un mariage ou des fiançailles."
  );
  assert.equal(line({ locale: "ar", kind: "general", category: "wedding" }), "أودّ طلب كعكة لعرس أو خطوبة.");
  assert.match(line({ locale: "en", kind: "general", occasion: "birth" })!, /new baby/);
  assert.match(line({ locale: "fr", kind: "general", category: "birthday-kids" })!, /anniversaire/);
  // Unknown / "all" categories keep the generic sentence; cake kind ignores it.
  assert.equal(line({ locale: "fr", kind: "general", category: "creation-coloree" }), "Je voudrais commander un gâteau personnalisé.");
  assert.equal(line({ locale: "fr", kind: "general", category: null }), "Je voudrais commander un gâteau personnalisé.");
  assert.match(line({ locale: "fr", kind: "tiramisu", category: "wedding" })!, /tiramisu/);
  assert.equal(occasionOfCategory("all"), null);
  assert.equal(occasionOfCategory("graduation"), "success");
});

test("tiramisu and sweets kinds, extra lines", () => {
  assert.match(buildWhatsAppMessage({ locale: "fr", kind: "tiramisu" }), /tiramisu personnalisé/);
  const sweets = buildWhatsAppMessage({ locale: "en", kind: "sweets", extra: ["Box: heart"] });
  assert.match(sweets, /party sweets/);
  assert.match(sweets, /\nBox: heart$/);
});

test("unknown locale falls back to FR; URL is wa.me with encoded text", () => {
  const url = buildWhatsAppUrl({ locale: "de", kind: "general" });
  assert.ok(url.startsWith("https://wa.me/213669592850?text="));
  assert.equal(decodeURIComponent(url.split("?text=")[1]).split("\n")[0], "Bonjour Gateaux Patience !");
});

test("cakeRef is stable, well-formed and unique on a realistic set", () => {
  const id = "be421475-28cd-4883-b466-980176a38d02";
  assert.equal(cakeRef(id), cakeRef(id));
  assert.match(cakeRef("x"), /^GP-[2-9A-HJKMNP-Z]{4}$/);
  assert.ok(!/[01ILO]/.test(REF_ALPHABET), "no look-alike characters");
  for (let i = 0; i < 500; i++) assert.ok(!/[01ILO]/.test(cakeRef(`id-${i}`).slice(3)));
  const ids = Array.from({ length: 300 }, (_, i) => `cake-${i}-${(i * 7919).toString(16)}`);
  assert.deepEqual(assertUniqueRefs(ids.map((v) => ({ id: v }))), []);
});

test("piping: weddings are or, others never or; occasions map", () => {
  assert.equal(pipingFor({ id: "a", category: "wedding" }), "or");
  for (let i = 0; i < 50; i++) assert.notEqual(pipingFor({ id: `c${i}`, category: "birthday-kids" }), "or");
  assert.equal(occasionFor("wedding"), "wedding");
  assert.equal(occasionFor("grossesse"), "birth");
  assert.equal(occasionFor("graduation"), "success");
  assert.equal(occasionFor("birthday-kids"), "birthday");
});
