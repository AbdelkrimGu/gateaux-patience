import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthed() {
  const c = await cookies();
  return c.get("admin_session")?.value === "authenticated";
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not set on the server." },
      { status: 503 }
    );
  }

  let body: { title?: string; category?: string; images?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, category, images } = body;
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Tu es un expert en pâtisserie artisanale travaillant pour "Gateaux Patience" en Algérie.

Titre du gâteau en français: "${title}"
Catégorie: "${category || "Gâteau"}"

Ta mission:
1. TRADUIS le titre français en arabe (dialecte standard, naturel) et en anglais. Garde le sens et le style commercial — ne traduis pas littéralement si une formulation plus naturelle existe dans la langue cible.
2. ÉCRIS une description commerciale courte (2-3 phrases, ~60 mots) pour ce gâteau dans les 3 langues. La description doit être attrayante, mettre en avant l'occasion et le style du gâteau.

Réponds UNIQUEMENT avec ce JSON valide, sans markdown, sans backticks, sans commentaires:
{
  "titles": {
    "ar": "العنوان بالعربية",
    "en": "Title in English"
  },
  "descriptions": {
    "fr": "description en français",
    "ar": "الوصف بالعربية",
    "en": "description in English"
  }
}`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];

  if (Array.isArray(images) && images.length > 0) {
    for (const imgBase64 of images.slice(0, 2)) {
      if (typeof imgBase64 !== "string") continue;
      const match = imgBase64.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1] as string,
            data: match[2] as string,
          },
        });
      }
    }
  }

  try {
    const result = await model.generateContent(parts);
    const text = result.response.text().trim();
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: {
      titles?: { ar?: string; en?: string };
      descriptions?: { fr?: string; ar?: string; en?: string };
    };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const objMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!objMatch) {
        return NextResponse.json(
          { error: "AI response was not valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(objMatch[0]);
    }

    return NextResponse.json({
      titles: {
        ar: parsed.titles?.ar || "",
        en: parsed.titles?.en || "",
      },
      descriptions: {
        fr: parsed.descriptions?.fr || "",
        ar: parsed.descriptions?.ar || "",
        en: parsed.descriptions?.en || "",
      },
    });
  } catch (err) {
    console.error("[generate-description]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI generation failed" },
      { status: 500 }
    );
  }
}
