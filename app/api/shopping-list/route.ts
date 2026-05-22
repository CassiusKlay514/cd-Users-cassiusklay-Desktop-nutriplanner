import { NextRequest, NextResponse } from "next/server";
import { getRecipe } from "@/lib/spoonacular";
import { classifyIngredient, normalizeQuantity, pickPack } from "@/lib/pantry";
import type { PlannedMeal, ShoppingItem } from "@/lib/types";

interface Body {
  recipeIds?: number[];      // mode legacy
  meals?: PlannedMeal[];     // mode Picnic : on connaît le servings + exclusions
  pantryNames?: string[];    // garde-manger global de l'utilisateur (exclusion auto)
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    // Détermine la source : meals (avec overrides) > recipeIds (legacy)
    const meals = body.meals;
    const recipeIds = body.recipeIds ?? meals?.map((m) => m.recipeId) ?? [];
    if (!recipeIds.length) return NextResponse.json({ items: [] });

    // Set du garde-manger pour exclusion
    const pantrySet = new Set((body.pantryNames ?? []).map((n) => n.toLowerCase().trim()));

    const uniqueIds = Array.from(new Set(recipeIds));
    const recipes = await Promise.all(uniqueIds.map(getRecipe));
    const recipeById = new Map(recipes.map((r) => [r.id, r]));

    // Pour chaque "meal", on accumule les ingrédients en appliquant servings + exclusions
    interface Bucket {
      displayName: string;
      totalAmount: number;
      unit: "g" | "ml" | "u";
      recipeIds: number[];
      aisle: string;
    }
    const agg = new Map<string, Bucket>();

    const sources: { recipeId: number; servings?: number; excluded?: number[] }[] =
      meals
        ? meals.map((m) => ({
            recipeId: m.recipeId,
            // Si invités, on prend le max entre servings recipe et guestCount
            servings: m.guestCount && m.guestCount > 0
              ? Math.max(m.servings ?? 0, m.guestCount)
              : m.servings,
            excluded: m.excludedIngredientIds,
          }))
        : uniqueIds.map((id) => ({ recipeId: id }));

    for (const src of sources) {
      const r = recipeById.get(src.recipeId);
      if (!r) continue;
      const ratio = src.servings && r.servings ? src.servings / r.servings : 1;
      const excludedSet = new Set(src.excluded ?? []);

      for (const ing of r.extendedIngredients ?? []) {
        if (excludedSet.has(ing.id)) continue;
        const rule = classifyIngredient(ing.name || ing.original);
        const key = rule.fr.toLowerCase();
        const norm = normalizeQuantity((ing.amount ?? 0) * ratio, ing.unit ?? "", ing.name ?? "");
        const existing = agg.get(key);
        if (existing) {
          if (existing.unit === norm.unit) existing.totalAmount += norm.amount;
          if (!existing.recipeIds.includes(r.id)) existing.recipeIds.push(r.id);
        } else {
          agg.set(key, {
            displayName: rule.fr,
            totalAmount: norm.amount,
            unit: norm.unit,
            recipeIds: [r.id],
            aisle: ing.aisle || "Divers",
          });
        }
      }
    }

    // Étape 2 : pack sizing + classification (filtre garde-manger)
    const items: ShoppingItem[] = [];
    for (const [key, info] of agg) {
      // Skip si dans le garde-manger
      const lower = info.displayName.toLowerCase();
      if (pantrySet.has(lower) ||
          Array.from(pantrySet).some((p) => lower.includes(p) || p.includes(lower))) {
        continue;
      }
      const rule = classifyIngredient(info.displayName);
      const pack = pickPack(info.totalAmount, rule);
      items.push({
        id: key,
        name: info.displayName,
        amount: pack.totalAmount,
        unit: pack.packUnit,
        aisle: categoryLabel(rule.category),
        checked: false,
        recipeIds: info.recipeIds,
        category: rule.category,
        optional: rule.optional,
        packSize: {
          amount: pack.packAmount,
          unit: pack.packUnit,
          label: pack.label,
        },
        leftoverRatio: pack.leftoverRatio,
      });
    }

    const categoryOrder: Record<string, number> = {
      fresh: 0, cold: 1, frozen: 2, pantry: 3, spice: 4,
    };
    items.sort((a, b) => {
      if (a.optional !== b.optional) return a.optional ? 1 : -1;
      const ca = categoryOrder[a.category ?? "pantry"] ?? 99;
      const cb = categoryOrder[b.category ?? "pantry"] ?? 99;
      if (ca !== cb) return ca - cb;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}

function categoryLabel(c: "pantry" | "spice" | "fresh" | "cold" | "frozen"): string {
  switch (c) {
    case "fresh": return "Fruits et légumes";
    case "cold": return "Frais (viande, poisson, crémerie)";
    case "frozen": return "Surgelés";
    case "spice": return "Épices et aromates";
    case "pantry": return "Placard";
  }
}
