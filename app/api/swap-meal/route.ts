import { NextRequest, NextResponse } from "next/server";
import { getClaude, MODEL } from "@/lib/claude";
import { nutrient, searchRecipes } from "@/lib/spoonacular";
import { translateTitlesFR } from "@/lib/translate";
import { ensureDietPrefs } from "@/lib/utils";
import type {
  MealMoment, PlannedMeal, SpoonacularRecipe, UserProfile,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  profile: UserProfile;
  date: string;
  moment: MealMoment;
  currentRecipeId: number;
  reason?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { profile, date, moment, currentRecipeId, reason } = (await req.json()) as Body;
    if (!profile || !date || !moment) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const target = profile.caloriesTarget;
    const split: Record<MealMoment, [number, number]> = {
      breakfast: [Math.round(target * 0.2), Math.round(target * 0.3)],
      lunch: [Math.round(target * 0.3), Math.round(target * 0.4)],
      dinner: [Math.round(target * 0.25), Math.round(target * 0.4)],
    };
    const [min, max] = split[moment];

    const candidates = await searchRecipes({
      dietPrefs: ensureDietPrefs(profile),
      moment,
      minCalories: min,
      maxCalories: max,
      number: 20,
    });

    const filtered = candidates.filter((c) => c.id !== currentRecipeId);
    if (!filtered.length) {
      return NextResponse.json({ error: "no alternative found" }, { status: 404 });
    }

    const claude = getClaude();
    const summary = filtered.map((r) => ({
      id: r.id,
      title: r.title,
      calories: nutrient(r, "Calories"),
      protein: nutrient(r, "Protein"),
      minutes: r.readyInMinutes ?? 30,
    }));

    const reply = await claude.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: "Tu choisis UN repas de substitution depuis une liste candidate, en fonction du contexte. Réponds en JSON strict: {\"recipeId\": <id>, \"reason\": \"<1 phrase fr>\"}.",
      messages: [{
        role: "user",
        content: `Profil: objectif ${profile.goal}, ${target}kcal/jour. Moment: ${moment}. Raison du swap: ${reason || "variation"}.
Candidats: ${JSON.stringify(summary)}
Choisis le meilleur et réponds en JSON.`,
      }],
    });
    const text = reply.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text).join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Pas de JSON renvoyé");
    const parsed = JSON.parse(m[0]) as { recipeId: number; reason: string };
    const picked = filtered.find((r) => r.id === parsed.recipeId) ?? filtered[0];

    const titleFR = (await translateTitlesFR([picked.title]))[picked.title] ?? picked.title;
    const meal: PlannedMeal = {
      date,
      moment,
      recipeId: picked.id,
      title: titleFR,
      image: picked.image,
      calories: nutrient(picked, "Calories"),
      protein: nutrient(picked, "Protein"),
      carbs: nutrient(picked, "Carbohydrates"),
      fat: nutrient(picked, "Fat"),
      ...(picked.readyInMinutes !== undefined ? { readyInMinutes: picked.readyInMinutes } : {}),
    };

    return NextResponse.json({ meal, reason: parsed.reason });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}

function _unused(_r: SpoonacularRecipe) { return _r; }
