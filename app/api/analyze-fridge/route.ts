import { NextRequest, NextResponse } from "next/server";
import { getClaude, MODEL } from "@/lib/claude";
import { cleanAiText } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  imageBase64: string;      // sans le préfixe data:image/...;base64,
  mimeType?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = (await req.json()) as Body;
    if (!imageBase64) {
      return NextResponse.json({ error: "image manquante" }, { status: 400 });
    }

    const media = (mimeType || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    const claude = getClaude();
    const reply = await claude.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: `Tu es un assistant nutritionnel français qui aide à analyser une photo de frigo, garde-manger ou placard.
Tu identifies UNIQUEMENT les ingrédients visibles et utilisables pour cuisiner.
Tu réponds en JSON strict de la forme:
{
  "ingredients": [
    { "name": "<nom français>", "category": "fresh|cold|pantry|frozen", "confidence": 0-1, "notes": "<optionnel>" }
  ],
  "summary": "<1 phrase amicale en français sur ce que tu vois>"
}
Règles:
- Maximum 25 ingrédients, les plus utiles pour cuisiner
- Noms toujours en français (ex: "Œufs", "Lait", "Tomates", "Poulet")
- Ignore les emballages illisibles ou les choses non identifiables
- Si la photo n'est clairement pas un frigo/placard, mets ingredients: [] et explique dans summary`,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: media, data: imageBase64 } },
          { type: "text", text: "Analyse cette photo et liste les ingrédients que tu vois." },
        ],
      }],
    });

    const text = reply.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Pas de JSON renvoyé");
    const parsed = JSON.parse(m[0]) as {
      ingredients: { name: string; category: string; confidence: number; notes?: string }[];
      summary: string;
    };

    return NextResponse.json({
      ingredients: parsed.ingredients.map((i) => ({
        ...i,
        name: cleanAiText(i.name),
        notes: i.notes ? cleanAiText(i.notes) : undefined,
      })),
      summary: cleanAiText(parsed.summary ?? ""),
    });
  } catch (e) {
    console.error("analyze-fridge error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
