"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChefHat, Clock, Flame, Heart, Loader2, Share2, Sparkles, Users,
} from "lucide-react";
import type { RecipeDetail } from "@/lib/types";
import { cleanAiText } from "@/lib/utils";

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/recipes/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec");
        setRecipe(data.recipe as RecipeDetail);
      } catch (e) {
        setError(e instanceof Error ? e.message : "unknown");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !recipe) {
    return (
      <div className="px-5 py-16 text-center">
        <div className="text-5xl mb-2">🍳</div>
        <p className="font-bold">Recette introuvable</p>
        <Link href="/recipes" className="text-primary text-sm mt-2 inline-block">
          Voir toutes les recettes
        </Link>
      </div>
    );
  }

  const kcal = recipe.nutrition?.nutrients.find((n) => n.name === "Calories")?.amount ?? 0;
  const protein = recipe.nutrition?.nutrients.find((n) => n.name === "Protein")?.amount ?? 0;
  const carbs = recipe.nutrition?.nutrients.find((n) => n.name === "Carbohydrates")?.amount ?? 0;
  const fat = recipe.nutrition?.nutrients.find((n) => n.name === "Fat")?.amount ?? 0;

  return (
    <div className="pb-12 bg-background">
      {/* Hero image avec gradient */}
      <div
        className="relative h-72 md:h-96 bg-cover bg-center"
        style={{ backgroundImage: `url(${recipe.image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between">
          <Link
            href="/recipes"
            className="w-11 h-11 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-md"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setFav((f) => !f)}
              className="w-11 h-11 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-md"
              aria-label="Favoris"
            >
              <Heart
                className={`w-5 h-5 ${fav ? "fill-rose-500 text-rose-500" : "text-gray-700"}`}
              />
            </button>
            <button
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({ title: recipe.title, url: window.location.href });
                  } catch { /* cancelled */ }
                } else {
                  navigator.clipboard?.writeText(window.location.href);
                }
              }}
              className="w-11 h-11 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-md"
              aria-label="Partager"
            >
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-5 text-white">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {recipe.dishTypes?.slice(0, 2).map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wide"
              >
                {translateDishType(t)}
              </span>
            ))}
            {recipe.diets?.slice(0, 2).map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-full bg-emerald-500/80 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wide"
              >
                {translateDiet(t)}
              </span>
            ))}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight drop-shadow">
            {recipe.title}
          </h1>
        </div>
      </div>

      {/* Stats card flottante */}
      <div className="max-w-3xl mx-auto px-5 md:px-10 -mt-8 relative">
        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-gray-100 p-4 md:p-5">
          <div className="grid grid-cols-3 gap-2">
            <Stat
              icon={<Clock className="w-4 h-4 text-primary" />}
              label="Préparation"
              value={recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : "rapide"}
            />
            <Stat
              icon={<Users className="w-4 h-4 text-primary" />}
              label="Portions"
              value={recipe.servings ? `${recipe.servings} pers.` : "4 pers."}
            />
            <Stat
              icon={<Flame className="w-4 h-4 text-accent" />}
              label="Par portion"
              value={`${Math.round(kcal)} kcal`}
            />
          </div>

          <div className="h-px bg-gray-100 my-4" />

          <div className="grid grid-cols-3 gap-2">
            <Macro label="Protéines" v={Math.round(protein)} color="blue" />
            <Macro label="Glucides" v={Math.round(carbs)} color="amber" />
            <Macro label="Lipides" v={Math.round(fat)} color="rose" />
          </div>
        </div>

        {/* Ingrédients */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-lg">
              Ingrédients
              <span className="text-sm text-gray-400 font-normal ml-2">
                pour {recipe.servings ?? 4} personnes
              </span>
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {recipe.extendedIngredients?.map((ing, i) => (
              <div key={`${ing.id}-${i}`} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-snug">{cleanAiText(ing.original)}</div>
                </div>
                <div className="shrink-0">
                  <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                    {ing.aisle ?? "Divers"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Préparation */}
        {recipe.instructions && (
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <ChefHat className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-lg">Préparation</h2>
            </div>
            <div
              className="bg-white rounded-2xl border border-gray-200 p-5 text-sm leading-relaxed text-gray-800 prose prose-sm max-w-none [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-2 [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: recipe.instructions }}
            />
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center text-gray-500 gap-1 text-[11px] uppercase tracking-wide font-semibold">
        {icon} {label}
      </div>
      <div className="font-bold text-base mt-1">{value}</div>
    </div>
  );
}

function Macro({ label, v, color }: { label: string; v: number; color: "blue" | "amber" | "rose" }) {
  const ring = {
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  }[color];
  const tint = {
    blue: "bg-blue-50",
    amber: "bg-amber-50",
    rose: "bg-rose-50",
  }[color];
  return (
    <div className={`rounded-xl ${tint} p-3`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-600 font-semibold">
        <span className={`w-2 h-2 rounded-full ${ring}`} /> {label}
      </div>
      <div className="font-bold text-base mt-1">{v}<span className="text-xs text-gray-500 font-normal ml-0.5">g</span></div>
    </div>
  );
}

// Traduction des dish types Spoonacular vers FR
function translateDishType(t: string): string {
  const map: Record<string, string> = {
    "main course": "Plat principal",
    "side dish": "Accompagnement",
    "dessert": "Dessert",
    "appetizer": "Entrée",
    "salad": "Salade",
    "bread": "Pain",
    "breakfast": "Petit-déj",
    "soup": "Soupe",
    "beverage": "Boisson",
    "sauce": "Sauce",
    "marinade": "Marinade",
    "fingerfood": "À la main",
    "snack": "Snack",
    "drink": "Boisson",
    "lunch": "Déjeuner",
    "dinner": "Dîner",
    "antipasti": "Antipasti",
    "starter": "Entrée",
    "antipasto": "Antipasti",
    "hor d'oeuvre": "Amuse-bouche",
    "morning meal": "Petit-déj",
    "brunch": "Brunch",
  };
  return map[t.toLowerCase()] ?? t;
}

function translateDiet(d: string): string {
  const map: Record<string, string> = {
    "gluten free": "Sans gluten",
    "ketogenic": "Cétogène",
    "vegetarian": "Végétarien",
    "lacto vegetarian": "Lacto-végétarien",
    "ovo vegetarian": "Ovo-végétarien",
    "vegan": "Végan",
    "pescetarian": "Pescétarien",
    "paleo": "Paléo",
    "primal": "Primal",
    "low fodmap": "Low FODMAP",
    "whole 30": "Whole 30",
    "dairy free": "Sans lactose",
  };
  return map[d.toLowerCase()] ?? d;
}
