import { NextRequest, NextResponse } from "next/server";
import { getClaude, MODEL } from "@/lib/claude";
import { cleanAiText } from "@/lib/utils";
import type { MealPlan, UserProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Body {
  messages: Message[];
  profile: UserProfile | null;
  plan: MealPlan | null;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, profile, plan } = (await req.json()) as Body;
    if (!messages?.length) {
      return NextResponse.json({ error: "messages requis" }, { status: 400 });
    }

    const planSummary = plan
      ? `Plan en cours: du ${plan.startDate} au ${plan.endDate}, ${plan.meals.length} repas. Quelques exemples: ${plan.meals.slice(0, 5).map((m) => `${m.title} (${m.date} ${m.moment}, ${m.calories} kcal)`).join("; ")}`
      : "Aucun plan en cours.";

    const profileSummary = profile
      ? `Profil: ${profile.name}, ${profile.age} ans, objectif ${profile.goal}, ${profile.caloriesTarget} kcal/jour. Régime principal: ${profile.dietPrefs?.mainDiet ?? "omnivore"}. Religieux: ${profile.dietPrefs?.religiousDiet ?? "aucun"}. Allergies: ${profile.dietPrefs?.allergies?.join(",") || "aucune"}. Exclusions: ${profile.dietPrefs?.exclusions?.join(",") || "aucune"}.`
      : "Pas de profil défini.";

    const claude = getClaude();
    const reply = await claude.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: `Tu es un coach nutritionnel français, sympa et concis (2-4 phrases max sauf si on te demande de développer).
Tu connais le profil et le plan actuel de l'utilisateur. Tu donnes des conseils pratiques, des astuces de cuisine, des substitutions, du contexte nutritionnel.
Tu peux suggérer des actions : régénérer le plan, remplacer un repas, ajouter au panier, marquer mangé, voir la liste de courses.
Tu ne fais JAMAIS de listes interminables, tu parles comme un ami qui s'y connaît.

CONTRAINTES DE STYLE STRICTES :
- INTERDIT : caractères markdown comme **bold**, __bold__, *italique*, listes à puces
- INTERDIT : tirets cadratins (—) ou demi-cadratins (–). Utilise une virgule, deux points ou parenthèses
- INTERDIT : emoji de drapeau ou symbole exotique
- AUTORISÉ : emojis culinaires sobres (🥗 🍲 🥐 💪 ✨) avec parcimonie
- Si tu cites un nom de plat, mets-le entre guillemets français « ainsi »
Si on te pose une question hors nutrition (politique, météo, etc.), tu recentres avec humour vers la cuisine.

${profileSummary}
${planSummary}`,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = reply.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");

    return NextResponse.json({ reply: cleanAiText(text) });
  } catch (e) {
    console.error("coach error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
