import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const { title, category, images } = await req.json();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Tu es un expert en pâtisserie artisanale. Écris une description commerciale attrayante pour un gâteau.

Titre du gâteau: "${title}"
Catégorie: "${category}"

Génère une description courte (2-3 phrases max, environ 60 mots par langue) pour ce gâteau dans 3 langues.

Réponds UNIQUEMENT avec ce JSON valide, sans markdown, sans backticks:
{
  "fr": "description en français",
  "ar": "الوصف بالعربية",
  "en": "description in English"
}`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];

  // Add up to 2 images if provided
  if (images && images.length > 0) {
    for (const imgBase64 of images.slice(0, 2)) {
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

  const result = await model.generateContent(parts);
  const text = result.response.text().trim();

  // Clean response if wrapped in markdown
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  const parsed = JSON.parse(cleaned) as { fr: string; ar: string; en: string };
  return NextResponse.json(parsed);
}
