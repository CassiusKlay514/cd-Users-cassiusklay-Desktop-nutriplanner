import "server-only";
import { getClaude, MODEL } from "./claude";
import type { RecipeDetail, SpoonacularRecipe } from "./types";

// Cache mémoire serveur (production : remplacer par Supabase ou Redis)
const titleCache = new Map<string, string>();
const recipeCache = new Map<number, RecipeDetail>();

// Traduction immédiate pour les rayons Spoonacular les plus communs
const AISLE_FR: Record<string, string> = {
  "Produce": "Fruits et légumes",
  "Meat": "Boucherie",
  "Seafood": "Poissonnerie",
  "Dairy": "Crémerie",
  "Cheese": "Fromages",
  "Milk, Eggs, Other Dairy": "Crémerie",
  "Bakery/Bread": "Pains et viennoiseries",
  "Pasta and Rice": "Pâtes et riz",
  "Canned and Jarred": "Conserves",
  "Frozen": "Surgelés",
  "Spices and Seasonings": "Épices et assaisonnements",
  "Oil, Vinegar, Salad Dressing": "Huiles et vinaigres",
  "Baking": "Pâtisserie",
  "Condiments": "Condiments",
  "Beverages": "Boissons",
  "Alcoholic Beverages": "Boissons alcoolisées",
  "Nut butters, Jams, and Honey": "Pâtes à tartiner et miels",
  "Nuts": "Fruits secs",
  "Health Foods": "Bio et diététique",
  "Asian": "Asiatique",
  "Ethnic Foods": "Cuisines du monde",
  "Refrigerated": "Réfrigéré",
  "Savory Snacks": "Apéritifs salés",
  "Sweet Snacks": "Confiseries",
  "Cereal": "Céréales",
  "Tea and Coffee": "Thé et café",
  "Gourmet": "Épicerie fine",
  "Gluten Free": "Sans gluten",
  "Pet Food": "Animalerie",
  "Not in Grocery Store/Homemade": "Maison",
};

export function translateAisle(aisle: string | undefined): string {
  if (!aisle) return "Divers";
  // Spoonacular renvoie parfois "Produce;Pasta and Rice", on prend le premier match
  const parts = aisle.split(/[;,]/).map((s) => s.trim());
  for (const p of parts) {
    if (AISLE_FR[p]) return AISLE_FR[p];
  }
  return parts[0] ?? "Divers";
}

// Traduction batch des titres (rapide, économe)
export async function translateTitlesFR(titles: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const toFetch: string[] = [];
  titles.forEach((t) => {
    if (titleCache.has(t)) out[t] = titleCache.get(t)!;
    else toFetch.push(t);
  });
  if (!toFetch.length) return out;

  try {
    const claude = getClaude();
    const reply = await claude.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: "Tu traduis des titres de recettes culinaires de l'anglais vers le français. Tu réponds UNIQUEMENT en JSON: un objet où chaque clé est le titre anglais d'entrée et chaque valeur la traduction française. Garde un style appétissant et naturel.",
      messages: [{
        role: "user",
        content: `Traduis ces titres de recettes en français:\n${JSON.stringify(toFetch)}`,
      }],
    });
    const text = reply.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text).join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]) as Record<string, string>;
      for (const k of Object.keys(parsed)) {
        titleCache.set(k, parsed[k]);
        out[k] = parsed[k];
      }
    }
  } catch (e) {
    console.warn("Translation failed:", e);
    // Fallback : on garde l'anglais
    toFetch.forEach((t) => { out[t] = t; });
  }
  return out;
}

// Helper pour traduire une SpoonacularRecipe
export async function translateRecipeMeta(r: SpoonacularRecipe): Promise<SpoonacularRecipe> {
  const dict = await translateTitlesFR([r.title]);
  return { ...r, title: dict[r.title] ?? r.title };
}

// Traduction complète d'une recette détaillée (titre + ingrédients + étapes)
export async function translateRecipeDetailFR(recipe: RecipeDetail): Promise<RecipeDetail> {
  if (recipeCache.has(recipe.id)) return recipeCache.get(recipe.id)!;

  try {
    const claude = getClaude();
    const payload = {
      title: recipe.title,
      instructions: recipe.instructions ?? "",
      ingredients: recipe.extendedIngredients?.map((i) => ({
        id: i.id,
        original: i.original,
        name: i.name,
      })) ?? [],
    };

    const reply = await claude.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: `Tu traduis des recettes culinaires de l'anglais vers le français.
Règles:
1. Convertis les unités américaines en métriques : cups → ml, oz → g, lb → g, tsp → c. à café, tbsp → c. à soupe, °F → °C.
2. Le ton doit être naturel et appétissant.
3. Conserve la structure HTML des instructions si présente (<ol>, <li>, etc.).
4. Pour les ingrédients : "original" doit être lisible en français, "name" doit être l'ingrédient seul (ex: "poulet").
Tu réponds UNIQUEMENT en JSON strict de la forme:
{
  "title": "...",
  "instructions": "...",
  "ingredients": [{ "id": <id>, "original": "...", "name": "..." }]
}`,
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    });
    const text = reply.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text).join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("No JSON");
    const parsed = JSON.parse(m[0]) as {
      title: string; instructions: string;
      ingredients: { id: number; original: string; name: string }[];
    };

    const ingMap = new Map(parsed.ingredients.map((i) => [i.id, i]));
    const translated: RecipeDetail = {
      ...recipe,
      title: parsed.title || recipe.title,
      instructions: parsed.instructions || recipe.instructions,
      extendedIngredients: recipe.extendedIngredients?.map((ing) => {
        const t = ingMap.get(ing.id);
        return {
          ...ing,
          original: t?.original ?? ing.original,
          name: t?.name ?? ing.name,
          aisle: translateAisle(ing.aisle),
        };
      }),
    };
    recipeCache.set(recipe.id, translated);
    return translated;
  } catch (e) {
    console.warn("Recipe translation failed:", e);
    return recipe;
  }
}
