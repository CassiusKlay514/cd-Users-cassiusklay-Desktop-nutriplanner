"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Flame, Loader2, Users } from "lucide-react";
import type { RecipeDetail } from "@/lib/types";

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return <div className="p-5 text-red-600">{error || "Recette introuvable"}</div>;
  }

  const kcal = recipe.nutrition?.nutrients.find((n) => n.name === "Calories")?.amount ?? 0;
  const protein = recipe.nutrition?.nutrients.find((n) => n.name === "Protein")?.amount ?? 0;
  const carbs = recipe.nutrition?.nutrients.find((n) => n.name === "Carbohydrates")?.amount ?? 0;
  const fat = recipe.nutrition?.nutrients.find((n) => n.name === "Fat")?.amount ?? 0;

  return (
    <div className="pb-10">
      <div
        className="relative h-64 md:h-80 bg-cover bg-center"
        style={{ backgroundImage: `url(${recipe.image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Link
          href="/recipes"
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      <div className="px-5 md:px-10 -mt-12 relative max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl p-5 md:p-7 border border-gray-200 shadow-sm">
          <h1 className="text-xl md:text-2xl font-bold leading-tight">{recipe.title}</h1>

          <div className="flex flex-wrap gap-2 mt-3">
            {recipe.dishTypes?.slice(0, 3).map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold capitalize">
                {t}
              </span>
            ))}
            {recipe.diets?.slice(0, 2).map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold capitalize">
                {t}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <Stat icon={<Clock className="w-4 h-4" />} label="Préparation" value={`${recipe.readyInMinutes ?? "—"} min`} />
            <Stat icon={<Users className="w-4 h-4" />} label="Portions" value={`${recipe.servings ?? "—"}`} />
            <Stat icon={<Flame className="w-4 h-4 text-accent" />} label="Calories" value={`${Math.round(kcal)}`} />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            <Macro label="Protéines" v={Math.round(protein)} unit="g" color="bg-blue-500" />
            <Macro label="Glucides" v={Math.round(carbs)} unit="g" color="bg-amber-500" />
            <Macro label="Lipides" v={Math.round(fat)} unit="g" color="bg-rose-500" />
          </div>
        </div>

        <section className="mt-6">
          <h2 className="font-bold text-lg mb-3">Ingrédients</h2>
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
            {recipe.extendedIngredients?.map((ing) => (
              <div key={`${ing.id}-${ing.original}`} className="p-3 flex justify-between text-sm">
                <span>{ing.original}</span>
                <span className="text-gray-400 text-xs">{ing.aisle}</span>
              </div>
            ))}
          </div>
        </section>

        {recipe.instructions && (
          <section className="mt-6">
            <h2 className="font-bold text-lg mb-3">Préparation</h2>
            <div
              className="prose prose-sm max-w-none text-gray-700"
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
      <div className="flex items-center justify-center text-gray-500 gap-1 text-xs">
        {icon} {label}
      </div>
      <div className="font-bold text-base mt-0.5">{value}</div>
    </div>
  );
}

function Macro({ label, v, unit, color }: { label: string; v: number; unit: string; color: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-500">
        <span className={`w-2 h-2 rounded-full ${color}`} /> {label}
      </div>
      <div className="font-bold text-sm mt-0.5">{v}{unit}</div>
    </div>
  );
}
