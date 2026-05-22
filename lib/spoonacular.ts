import "server-only";
import type { Allergy, Diet, MealMoment, RecipeDetail, SpoonacularRecipe } from "./types";
import type { DietPreferences } from "./dietPresets";
import { buildSpoonacularQuery } from "./dietPresets";

const BASE = "https://api.spoonacular.com";

function apiKey() {
  const k = process.env.SPOONACULAR_API_KEY;
  if (!k) throw new Error("SPOONACULAR_API_KEY missing");
  return k;
}

const DIET_MAP: Record<Diet, string> = {
  none: "",
  vegetarian: "vegetarian",
  vegan: "vegan",
  pescetarian: "pescetarian",
  ketogenic: "ketogenic",
  paleo: "paleo",
  gluten_free: "gluten free",
};

const ALLERGY_MAP: Record<Allergy, string> = {
  dairy: "dairy",
  egg: "egg",
  gluten: "gluten",
  peanut: "peanut",
  seafood: "seafood",
  shellfish: "shellfish",
  soy: "soy",
  tree_nut: "tree nut",
  wheat: "wheat",
};

const MOMENT_TYPE: Record<MealMoment, string> = {
  breakfast: "breakfast",
  lunch: "main course",
  dinner: "main course",
};

interface SearchParams {
  // Legacy
  diet?: Diet;
  allergies?: Allergy[];
  exclude?: string[];
  // Nouveau
  dietPrefs?: DietPreferences;
  // Communs
  moment?: MealMoment;
  minCalories?: number;
  maxCalories?: number;
  maxReadyTime?: number;
  query?: string;
  sort?: string;
  direction?: string;
  includeIngredients?: string[];
  number?: number;
  offset?: number;
}

export async function searchRecipes(p: SearchParams): Promise<SpoonacularRecipe[]> {
  const params = new URLSearchParams({
    apiKey: apiKey(),
    addRecipeNutrition: "true",
    number: String(p.number ?? 30),
    offset: String(p.offset ?? 0),
    sort: "popularity",
    instructionsRequired: "true",
  });
  // Nouveau système : dietPrefs prioritaire
  if (p.dietPrefs) {
    const q = buildSpoonacularQuery(p.dietPrefs);
    if (q.diet) params.set("diet", q.diet);
    if (q.intolerances) params.set("intolerances", q.intolerances);
    if (q.excludeIngredients) params.set("excludeIngredients", q.excludeIngredients);
  } else {
    // Fallback legacy
    if (p.diet && p.diet !== "none") params.set("diet", DIET_MAP[p.diet]);
    if (p.allergies?.length) {
      params.set("intolerances", p.allergies.map((a) => ALLERGY_MAP[a]).join(","));
    }
    if (p.exclude?.length) params.set("excludeIngredients", p.exclude.join(","));
  }
  if (p.moment) params.set("type", MOMENT_TYPE[p.moment]);
  if (p.minCalories) params.set("minCalories", String(p.minCalories));
  if (p.maxCalories) params.set("maxCalories", String(p.maxCalories));
  if (p.maxReadyTime) params.set("maxReadyTime", String(p.maxReadyTime));
  if (p.query) params.set("query", p.query);
  if (p.sort) params.set("sort", p.sort);
  if (p.direction) params.set("direction", p.direction);
  if (p.includeIngredients?.length) {
    params.set("includeIngredients", p.includeIngredients.join(","));
    // Sort by popularity not relevance to surface real matches
    if (!p.sort) params.set("sort", "max-used-ingredients");
    params.set("ranking", "1");
  }

  const r = await fetch(`${BASE}/recipes/complexSearch?${params}`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Spoonacular search ${r.status}`);
  const data = await r.json();
  return data.results as SpoonacularRecipe[];
}

export async function getRecipe(id: number): Promise<RecipeDetail> {
  const params = new URLSearchParams({
    apiKey: apiKey(),
    includeNutrition: "true",
  });
  const r = await fetch(`${BASE}/recipes/${id}/information?${params}`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Spoonacular recipe ${r.status}`);
  return (await r.json()) as RecipeDetail;
}

export function nutrient(recipe: SpoonacularRecipe, name: string): number {
  const n = recipe.nutrition?.nutrients.find(
    (x) => x.name.toLowerCase() === name.toLowerCase()
  );
  return n ? Math.round(n.amount) : 0;
}
