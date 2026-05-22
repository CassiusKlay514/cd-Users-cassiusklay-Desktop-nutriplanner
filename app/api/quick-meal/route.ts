import { NextRequest, NextResponse } from "next/server";
import { nutrient, searchRecipes } from "@/lib/spoonacular";
import { ensureDietPrefs } from "@/lib/utils";
import type { MealMoment, PlannedMeal, UserProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  profile: UserProfile;
  moment: MealMoment;
  maxMinutes?: number;
  availableIngredients?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { profile, moment, maxMinutes, availableIngredients } = (await req.json()) as Body;
    if (!profile || !moment) {
      return NextResponse.json({ error: "missing" }, { status: 400 });
    }

    const target = profile.caloriesTarget;
    const split: Record<MealMoment, [number, number]> = {
      breakfast: [Math.round(target * 0.2), Math.round(target * 0.3)],
      lunch: [Math.round(target * 0.3), Math.round(target * 0.4)],
      dinner: [Math.round(target * 0.25), Math.round(target * 0.4)],
    };
    const [min, max] = split[moment];

    const results = await searchRecipes({
      dietPrefs: ensureDietPrefs(profile),
      moment,
      minCalories: min,
      maxCalories: max,
      maxReadyTime: maxMinutes ?? 25,
      number: 10,
      includeIngredients: availableIngredients,
    });

    if (!results.length) {
      return NextResponse.json({ error: "Aucune recette rapide trouvée" }, { status: 404 });
    }

    const picked = results[Math.floor(Math.random() * Math.min(5, results.length))];
    const meal: PlannedMeal = {
      date: new Date().toISOString().split("T")[0],
      moment,
      recipeId: picked.id,
      title: picked.title,
      image: picked.image,
      calories: nutrient(picked, "Calories"),
      protein: nutrient(picked, "Protein"),
      carbs: nutrient(picked, "Carbohydrates"),
      fat: nutrient(picked, "Fat"),
    };
    if (picked.readyInMinutes !== undefined) meal.readyInMinutes = picked.readyInMinutes;

    return NextResponse.json({ meal });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
