import { NextRequest, NextResponse } from "next/server";
import { getClaude, MODEL } from "@/lib/claude";
import { cleanAiText } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  meals: { title: string; date: string; moment: string }[];
  budget?: "eco" | "moyen" | "premium";
}

export async function POST(req: NextRequest) {
  try {
    const { meals, budget } = (await req.json()) as Body;
    if (!meals?.length) return NextResponse.json({ pairings: [] });

    const claude = getClaude();
    const dinners = meals.filter((m) => m.moment === "dinner").slice(0, 7);
    if (!dinners.length) return NextResponse.json({ pairings: [] });

    const reply = await claude.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: `Tu es sommelier français. Tu proposes UN accord mets/vins (ou alternative sans alcool) pour chaque dîner reçu.
Tu réponds UNIQUEMENT en JSON strict, SANS commentaire, SANS texte autour, SANS virgule de fin de tableau.
Schéma:
{"pairings":[{"date":"YYYY-MM-DD","meal":"<repas>","wineType":"<vin rouge|vin blanc|vin rosé|champagne|sans alcool>","suggestion":"<appellation FR>","reason":"<1 phrase>","priceRange":"<5-10€|10-20€|20€+>"}]}
Budget cible: ${budget ?? "moyen"}. Dessert → vin moelleux. Poisson → blanc. Viande rouge → rouge.`,
      messages: [
        { role: "user", content: `Dîners: ${JSON.stringify(dinners)}` },
        { role: "assistant", content: '{"pairings":[' }, // prefill pour forcer JSON
      ],
    });

    const text = reply.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");

    // Tente de reconstruire à partir du prefill
    let parsed: { pairings: unknown[] } | null = null;
    const tryParse = (raw: string) => {
      try { return JSON.parse(raw) as { pairings: unknown[] }; } catch { return null; }
    };

    // 1. Si Claude a fermé proprement
    parsed = tryParse(`{"pairings":[${text}`);
    // 2. Sinon retire la dernière virgule éventuelle et tente
    if (!parsed) {
      const cleaned = text.replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");
      parsed = tryParse(`{"pairings":[${cleaned}`);
    }
    // 3. Sinon tronque au dernier "}" trouvé et ferme l'array
    if (!parsed) {
      const lastClose = text.lastIndexOf("}");
      if (lastClose > 0) {
        const truncated = text.substring(0, lastClose + 1);
        parsed = tryParse(`{"pairings":[${truncated}]}`);
      }
    }
    if (!parsed) throw new Error("Réponse Claude inexploitable");
    // Nettoie markdown/tirets dans chaque suggestion
    const cleaned = {
      pairings: (parsed.pairings as Array<{ reason?: string; suggestion?: string; meal?: string }>).map((p) => ({
        ...p,
        reason: cleanAiText(p.reason ?? ""),
        suggestion: cleanAiText(p.suggestion ?? ""),
        meal: cleanAiText(p.meal ?? ""),
      })),
    };
    return NextResponse.json(cleaned);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
