import { NextRequest, NextResponse } from "next/server";
import { getClaude, MODEL } from "@/lib/claude";
import { nutrient, searchRecipes } from "@/lib/spoonacular";
import { translateTitlesFR } from "@/lib/translate";
import { ensureDietPrefs } from "@/lib/utils";
import type {
  MealHistoryEntry,
  MealMoment,
  MealPlan,
  PlannedMeal,
  SpoonacularRecipe,
  UserProfile,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  profile: UserProfile;
  startDate: string;
  endDate: string;
  availableIngredients?: string[];
  history?: MealHistoryEntry[];
  pantryNames?: string[];
  batchMode?: boolean;              // batch cooking : recettes qui se conservent
}

function daysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const s = new Date(start);
  const e = new Date(end);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

function formatHistory(history: MealHistoryEntry[]): string {
  const recent = history.slice(-40);
  const loved = recent.filter((h) => (h.rating ?? 0) >= 4).slice(-8);
  const hated = recent.filter((h) => (h.rating ?? 0) === 1 || (h.rating ?? 0) === 2).slice(-8);
  const skipped = recent.filter((h) => h.skipped).slice(-8);
  if (!loved.length && !hated.length && !skipped.length) return "";
  let s = "\n*Historique*:";
  if (loved.length) s += `\n- A adoré (≥4★): ${loved.map((h) => h.title).join(", ")}`;
  if (hated.length) s += `\n- N'a pas aimé (≤2★, à éviter): ${hated.map((h) => h.title).join(", ")}`;
  if (skipped.length) s += `\n- Skippé récemment: ${skipped.map((h) => h.title).join(", ")}`;
  return s;
}

function candidateLite(r: SpoonacularRecipe) {
  return {
    id: r.id,
    title: r.title,
    calories: nutrient(r, "Calories"),
    protein: nutrient(r, "Protein"),
    carbs: nutrient(r, "Carbohydrates"),
    fat: nutrient(r, "Fat"),
    minutes: r.readyInMinutes ?? 30,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { profile, startDate, endDate, availableIngredients, history, pantryNames, batchMode } = (await req.json()) as Body;
    if (!profile || !startDate || !endDate) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const days = daysBetween(startDate, endDate);
    const target = profile.caloriesTarget;
    const moments: MealMoment[] = ["breakfast", "lunch", "dinner"];
    const calorieSplit: Record<MealMoment, [number, number]> = {
      breakfast: [Math.round(target * 0.2), Math.round(target * 0.3)],
      lunch: [Math.round(target * 0.3), Math.round(target * 0.4)],
      dinner: [Math.round(target * 0.25), Math.round(target * 0.4)],
    };

    const dietPrefs = ensureDietPrefs(profile);
    const useFridge = (availableIngredients?.length ?? 0) > 0;
    const fetchByMoment = async (m: MealMoment) => {
      const [min, max] = calorieSplit[m];
      const results = await searchRecipes({
        dietPrefs,
        moment: m,
        minCalories: min,
        maxCalories: max,
        number: 25,
        includeIngredients: useFridge ? availableIngredients : undefined,
      });
      return results;
    };

    const [breakfasts, lunches, dinners] = await Promise.all(
      moments.map(fetchByMoment)
    );

    const candidates = {
      breakfast: breakfasts.map(candidateLite),
      lunch: lunches.map(candidateLite),
      dinner: dinners.map(candidateLite),
    };

    const allRecipes = [...breakfasts, ...lunches, ...dinners];
    const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));

    const claude = getClaude();
    const sys = `Tu es un coach nutritionnel français. Tu construis des plans de repas équilibrés.
Règles:
1. Tu reçois la liste des recettes candidates par moment et tu sélectionnes UNE recette par moment et par jour.
2. Respecte l'objectif calorique quotidien (±10%).
3. Varie les repas mais regroupe intelligemment : si tu utilises du poulet le lundi soir, propose une autre recette poulet dans les 2 jours qui suivent (anti-gaspillage des packs).
4. Idem pour saumon, bœuf, poisson : prévois 2 utilisations rapprochées.
5. Jamais deux fois la même recette dans le plan.
6. Tu réponds UNIQUEMENT en JSON valide selon le schéma demandé.${
batchMode ? `
7. ⚡ MODE BATCH COOKING : l'utilisateur cuisine le DIMANCHE pour toute la semaine.
   - Privilégie des recettes qui se conservent 3-4 jours (currys, chilis, soupes, lasagnes, gratins, ratatouilles, salades de céréales).
   - Évite les recettes fragiles (poisson cru, salades très vertes, plats qui détrempent).
   - Regroupe au max les protéines : idéalement 2 protéines max sur la semaine.
   - Le commentaire 'notes' doit expliquer le plan de prep du dimanche (ex: "Dimanche matin : cuire le poulet + préparer la sauce tomate. Lundi soir : assemblage des wraps").
` : ""}`;

    const userMsg = `Profil utilisateur:
- Objectif: ${profile.goal}
- Cible calorique journalière: ${target} kcal
- Régime principal: ${dietPrefs.mainDiet}
- Régime religieux: ${dietPrefs.religiousDiet}
- Régime santé: ${dietPrefs.healthDiet}
- Exclusions: ${dietPrefs.exclusions.join(", ") || "aucune"}
- Allergies sévères: ${dietPrefs.allergies.join(", ") || "aucune"}
- N'aime pas: ${dietPrefs.dislikes.join(", ") || "rien de spécifique"}
${useFridge ? `\n*Photo du frigo*: l'utilisateur a déjà ${availableIngredients!.join(", ")}. Privilégie les recettes qui utilisent ces ingrédients.` : ""}
${pantryNames?.length ? `\n*Garde-manger*: ${pantryNames.slice(0, 30).join(", ")}.` : ""}
${history?.length ? formatHistory(history) : ""}

Jours à planifier: ${days.join(", ")}

Recettes candidates (id, title, calories, protein, carbs, fat, minutes):
PETIT DÉJEUNER:
${JSON.stringify(candidates.breakfast)}

DÉJEUNER:
${JSON.stringify(candidates.lunch)}

DÎNER:
${JSON.stringify(candidates.dinner)}

Réponds par un JSON exactement de la forme:
{
  "notes": "1-2 phrases de conseil personnalisé en français",
  "meals": [
    { "date": "YYYY-MM-DD", "moment": "breakfast"|"lunch"|"dinner", "recipeId": <number> }
  ]
}
Il doit y avoir exactement ${days.length * 3} entrées dans meals (3 par jour, 1 par moment).`;

    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: sys,
      messages: [{ role: "user", content: userMsg }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Claude n'a pas renvoyé de JSON valide");
    const parsed = JSON.parse(jsonMatch[0]) as {
      notes: string;
      meals: { date: string; moment: MealMoment; recipeId: number }[];
    };

    // Traduction batch des titres choisis
    const selectedTitles = parsed.meals
      .map((m) => recipeMap.get(m.recipeId)?.title)
      .filter((t): t is string => Boolean(t));
    const titlesFR = await translateTitlesFR(Array.from(new Set(selectedTitles)));

    const meals: PlannedMeal[] = [];
    for (const m of parsed.meals) {
      const r = recipeMap.get(m.recipeId);
      if (!r) continue;
      const item: PlannedMeal = {
        date: m.date,
        moment: m.moment,
        recipeId: r.id,
        title: titlesFR[r.title] ?? r.title,
        image: r.image,
        calories: nutrient(r, "Calories"),
        protein: nutrient(r, "Protein"),
        carbs: nutrient(r, "Carbohydrates"),
        fat: nutrient(r, "Fat"),
      };
      if (r.readyInMinutes !== undefined) item.readyInMinutes = r.readyInMinutes;
      meals.push(item);
    }

    const plan: MealPlan = {
      id: crypto.randomUUID(),
      startDate,
      endDate,
      meals,
      createdAt: new Date().toISOString(),
      notes: parsed.notes,
    };

    return NextResponse.json({ plan });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
