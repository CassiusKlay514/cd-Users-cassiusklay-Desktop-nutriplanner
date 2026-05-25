"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Flame, Loader2, Search, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { SpoonacularRecipe } from "@/lib/types";

interface QuickFilter {
  id: string;
  label: string;
  emoji: string;
  params: Record<string, string>;
  postFilter?: (r: SpoonacularRecipe & { extendedIngredients?: unknown[] }) => boolean;
}

const SEASON_LABEL = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"][new Date().getMonth()];

const QUICK_FILTERS: QuickFilter[] = [
  { id: "all", label: "Tout", emoji: "✨", params: {} },
  { id: "season", label: `De saison (${SEASON_LABEL})`, emoji: "🌿", params: { season: "1" } },
  { id: "express", label: "Express 15 min", emoji: "⚡", params: { maxReadyTime: "15" } },
  { id: "fast", label: "Rapide 30 min", emoji: "⏱️", params: { maxReadyTime: "30" } },
  { id: "onepot", label: "One-pot", emoji: "🥘", params: { query: "one pot" } },
  { id: "airfryer", label: "Airfryer", emoji: "🍟", params: { query: "air fryer" } },
  { id: "5ing", label: "5 ingrédients", emoji: "🤏", params: { number: "60" } },
  { id: "healthy", label: "Healthy", emoji: "🥗", params: { sort: "healthiness" } },
  { id: "cheap", label: "Pas cher", emoji: "💸", params: { sort: "price", direction: "asc" } },
  { id: "kids", label: "Enfants", emoji: "🧒", params: { query: "kid friendly" } },
];

export default function RecipesPage() {
  const profile = useStore((s) => s.profile);
  const [recipes, setRecipes] = useState<SpoonacularRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const sp = new URLSearchParams();
        if (profile?.dietPrefs) {
          const { mainDiet, healthDiet, allergies, exclusions, dislikes } = profile.dietPrefs;
          if (mainDiet !== "omnivore") sp.set("diet", mainDiet);
          else if (healthDiet !== "none") sp.set("diet", healthDiet);
          if (allergies.length) sp.set("allergies", allergies.join(","));
          const ex = [...exclusions, ...dislikes];
          if (ex.length) sp.set("exclude", ex.join(","));
        }
        const filter = QUICK_FILTERS.find((f) => f.id === activeFilter);
        Object.entries(filter?.params ?? {}).forEach(([k, v]) => sp.set(k, v));
        if (!sp.get("number")) sp.set("number", "40");
        const res = await fetch(`/api/recipes/search?${sp}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec");
        let results = data.results as SpoonacularRecipe[];
        // Post-filter pour "5 ingrédients"
        if (activeFilter === "5ing") {
          results = results.filter((r) =>
            ((r as SpoonacularRecipe & { extendedIngredients?: unknown[] }).extendedIngredients?.length ?? 99) <= 5
          );
        }
        if (active) setRecipes(results);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "unknown");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [profile, activeFilter]);

  const filtered = useMemo(
    () => recipes.filter((r) => r.title.toLowerCase().includes(query.toLowerCase())),
    [recipes, query]
  );

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bibliothèque de recettes</h1>
      <p className="text-gray-600 text-sm mt-1">
        {loading
          ? "Chargement des recettes…"
          : recipes.length > 0
          ? `Filtrées selon votre profil. ${recipes.length} résultat${recipes.length > 1 ? "s" : ""}.`
          : "Aucune recette ne correspond à ces filtres. Essayez « Tout »."}
      </p>

      <div className="mt-4 relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une recette…"
          className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-gray-200 text-sm"
        />
      </div>

      {/* Quick filters Picnic-style */}
      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" /> Prêt en un clin d'œil
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 md:mx-0 md:px-0 pb-1">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold border transition flex items-center gap-1.5",
                f.id === activeFilter
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/30"
                  : "bg-white border-gray-200 text-gray-700"
              )}
            >
              <span>{f.emoji}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="aspect-square bg-gray-100 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {!loading && (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((r) => {
            const kcal = r.nutrition?.nutrients.find((n) => n.name === "Calories")?.amount ?? 0;
            return (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden active:scale-[0.98] transition"
              >
                <div
                  className="aspect-square bg-cover bg-center"
                  style={{ backgroundImage: `url(${r.image})` }}
                />
                <div className="p-3">
                  <div className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                    {r.title}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {r.readyInMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {r.readyInMinutes} min
                      </span>
                    )}
                    {kcal > 0 && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-accent" />
                        {Math.round(kcal)} kcal
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          Aucune recette ne correspond.
        </div>
      )}
    </div>
  );
}
