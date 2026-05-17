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

  let body: { fr?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fr = (body.fr || "").trim();
  if (!fr) {
    return NextResponse.json({ error: "FR label is required" }, { status: 400 });
  }
  if (fr.length > 200) {
    return NextResponse.json({ error: "FR label too long" }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Translate this French label for a cake category in an Algerian bakery into Arabic and English.
Keep it short and natural (2-4 words), commercial style — not a literal word-for-word translation.

French label: "${fr}"

Respond ONLY with this JSON, no markdown, no backticks, no commentary:
{
  "ar": "الترجمة بالعربية",
  "en": "English translation"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: { ar?: string; en?: string };
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
      ar: (parsed.ar || "").trim(),
      en: (parsed.en || "").trim(),
    });
  } catch (err) {
    console.error("[translate-label]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Translation failed" },
      { status: 500 }
    );
  }
}
