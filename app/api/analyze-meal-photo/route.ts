import { NextRequest, NextResponse } from "next/server";
import { getClaude, MODEL } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  imageBase64: string;
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
      max_tokens: 1000,
      system: `Tu es un nutritionniste français qui estime la composition d'un plat depuis une photo.
Tu identifies le plat, estimes les portions et calcules calories + macros.
Tu réponds en JSON strict:
{
  "dishName": "<nom français du plat>",
  "estimatedServings": <nombre>,
  "calories": <nombre>,
  "protein": <grammes>,
  "carbs": <grammes>,
  "fat": <grammes>,
  "confidence": "low" | "medium" | "high",
  "components": ["<composant 1>", "..."],
  "note": "<1 phrase amicale sur le plat>"
}
Règles:
- Sois précis mais reste prudent : si tu doutes, mets confidence "low" et note explique pourquoi
- Estimes les valeurs pour la portion VISIBLE dans la photo
- Si ce n'est clairement pas un plat de cuisine, renvoie dishName: "Inconnu" et explique dans note`,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: media, data: imageBase64 } },
          { type: "text", text: "Analyse ce plat." },
        ],
      }],
    });

    const text = reply.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Pas de JSON renvoyé");
    return NextResponse.json(JSON.parse(m[0]));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
