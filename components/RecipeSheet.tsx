"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChefHat, Check, Clock, Flame, Loader2, Minus, Plus, RefreshCw, ShoppingBag, Star, Users, X,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { cn, formatAmountUnit } from "@/lib/utils";
import CookingMode from "./CookingMode";
import type { MealMoment, PlannedMeal, RecipeDetail } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  meal: PlannedMeal | null;
  onSwapped?: (newMeal: PlannedMeal) => void;
}

const MOMENT_LABEL: Record<MealMoment, string> = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  dinner: "Dîner",
};

export default function RecipeSheet({ open, onClose, meal, onSwapped }: Props) {
  const profile = useStore((s) => s.profile);
  const updateMeal = useStore((s) => s.updateMeal);
  const toggleConsumed = useStore((s) => s.toggleConsumed);
  const rateMeal = useStore((s) => s.rateMeal);
  const [cookingOpen, setCookingOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Etat local Picnic-style
  const [servings, setServings] = useState<number>(meal?.servings ?? 4);
  const [excludedIds, setExcludedIds] = useState<Set<number>>(
    new Set(meal?.excludedIngredientIds ?? [])
  );

  useEffect(() => {
    if (!open || !meal) return;
    setRecipe(null);
    setError(null);
    setLoading(true);
    setServings(meal.servings ?? 4);
    setExcludedIds(new Set(meal.excludedIngredientIds ?? []));
    setRating(meal.rating ?? null);
    setNote(meal.note ?? "");
    fetch(`/api/recipes/${meal.recipeId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.recipe) {
          const r = d.recipe as RecipeDetail;
          setRecipe(r);
          if (!meal.servings && r.servings) setServings(r.servings);
        }
        else throw new Error(d.error || "Erreur");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, meal?.recipeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const swap = async () => {
    if (!meal || !profile) return;
    setSwapping(true);
    setError(null);
    try {
      const res = await fetch("/api/swap-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile, date: meal.date, moment: meal.moment, currentRecipeId: meal.recipeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      onSwapped?.(data.meal as PlannedMeal);
      toast.success("Repas remplacé", {
        description: `Désormais : ${(data.meal as PlannedMeal).title}`,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setSwapping(false);
    }
  };

  const saveOverrides = () => {
    if (!meal) return;
    setSaving(true);
    updateMeal(meal.date, meal.moment, {
      servings,
      excludedIngredientIds: Array.from(excludedIds),
    });
    toast.success("Panier mis à jour", {
      description: `${ingredients.length - excludedIds.size} ingrédients pour ${servings} personne${servings > 1 ? "s" : ""}`,
    });
    setTimeout(() => { setSaving(false); onClose(); }, 250);
  };

  const ingredients = recipe?.extendedIngredients ?? [];
  const originalServings = recipe?.servings ?? 4;
  const ratio = servings / originalServings;

  const selectedCount = ingredients.length - excludedIds.size;

  const toggleExcluded = (id: number) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!open) return null;

  const kcal = recipe?.nutrition?.nutrients.find((n) => n.name === "Calories")?.amount ?? 0;
  const adjustedKcal = Math.round((kcal * ratio));

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full md:max-w-2xl md:rounded-3xl bg-white rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl animate-slide-up"
        role="dialog"
        aria-modal="true"
      >
        <div className="md:hidden flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto flex-1 pb-32">
          {meal && (
            <div
              className="relative h-48 md:h-56 bg-cover bg-center"
              style={{ backgroundImage: `url(${meal.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <div className="text-xs opacity-80 uppercase tracking-wide">
                  {MOMENT_LABEL[meal.moment]}
                </div>
                <h2 className="font-bold text-xl mt-0.5 leading-tight">{meal.title}</h2>
              </div>
            </div>
          )}

          <div className="px-5 md:px-7 pt-5">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {recipe && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <Stat icon={<Clock className="w-4 h-4" />} label="Prép." value={`${recipe.readyInMinutes ?? "·"} min`} />
                  <Stat icon={<Users className="w-4 h-4" />} label="Pers." value={`${originalServings}`} />
                  <Stat icon={<Flame className="w-4 h-4 text-accent" />} label="Cal/pers." value={`${Math.round(kcal)}`} />
                </div>

                {/* Servings adjuster */}
                <div className="mt-5 bg-primary/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Pour combien de personnes ?</div>
                      <div className="font-bold text-lg mt-0.5">{servings} personne{servings > 1 ? "s" : ""}</div>
                      <div className="text-xs text-primary mt-0.5">≈ {adjustedKcal} kcal au total</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setServings(Math.max(1, servings - 1))}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setServings(Math.min(20, servings + 1))}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ingrédients Picnic-style */}
                <section className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">Ingrédients</h3>
                    <span className="text-xs text-gray-500">
                      {selectedCount}/{ingredients.length} au panier
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Décochez ce que vous avez déjà chez vous.
                  </p>
                  <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
                    {ingredients.map((ing) => {
                      const excluded = excludedIds.has(ing.id);
                      const scaledAmount = ((ing.amount ?? 0) * ratio);
                      const amountStr = scaledAmount > 0
                        ? formatAmountUnit(scaledAmount, ing.unit)
                        : "";
                      return (
                        <button
                          key={ing.id}
                          onClick={() => toggleExcluded(ing.id)}
                          className="w-full text-left p-3 flex items-center gap-3"
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0",
                            !excluded ? "bg-primary border-primary" : "border-gray-300 bg-white"
                          )}>
                            {!excluded && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                          </div>
                          <div className={cn("flex-1 min-w-0", excluded && "opacity-50")}>
                            <div className="font-medium text-sm capitalize">{ing.name}</div>
                            {amountStr && (
                              <div className="text-xs text-gray-500">{amountStr}</div>
                            )}
                          </div>
                          {excluded && (
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full shrink-0">
                              J'ai déjà
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Actions secondaires */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCookingOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-semibold"
                  >
                    <ChefHat className="w-4 h-4" />
                    Mode cuisine
                  </button>
                  <button
                    onClick={swap}
                    disabled={swapping}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold disabled:opacity-50"
                  >
                    {swapping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Remplacer
                  </button>
                </div>

                {/* Note & rating si meal sélectionné */}
                {meal && (
                  <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-amber-900">
                        Comment était cette recette ?
                      </div>
                      <button
                        onClick={() => setNoteOpen((v) => !v)}
                        className="text-xs text-amber-700 font-semibold"
                      >
                        {noteOpen ? "Fermer" : "+ Note"}
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => {
                            setRating(n);
                            rateMeal(meal.date, meal.moment, n, note);
                          }}
                          className="text-2xl"
                        >
                          <Star
                            className={cn(
                              "w-7 h-7",
                              (rating ?? 0) >= n
                                ? "fill-amber-400 text-amber-500"
                                : "text-amber-300"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    {noteOpen && (
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onBlur={() => rateMeal(meal.date, meal.moment, rating ?? 0, note)}
                        placeholder="Trop salée, à refaire avec plus d'épices..."
                        className="mt-3 w-full px-3 py-2 rounded-xl border border-amber-200 text-sm bg-white"
                        rows={2}
                      />
                    )}
                  </div>
                )}

                {/* Instructions */}
                {recipe.instructions && (
                  <section className="mt-6">
                    <h3 className="font-bold mb-2">Préparation</h3>
                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: recipe.instructions }}
                    />
                  </section>
                )}
              </>
            )}

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
            )}
          </div>
        </div>

        {/* Action bar fixe Picnic */}
        {recipe && (
          <div className="absolute bottom-0 inset-x-0 z-20 px-4 pb-4 pt-3 bg-gradient-to-t from-white via-white to-transparent">
            <div className="flex gap-2">
              {meal && (
                <button
                  onClick={() => toggleConsumed(meal.date, meal.moment)}
                  className={cn(
                    "px-4 py-3 rounded-2xl border text-sm font-semibold",
                    meal.consumed
                      ? "bg-amber-100 border-amber-300 text-amber-900"
                      : "bg-white border-gray-200 text-gray-700"
                  )}
                  title={meal.consumed ? "Marqué mangé" : "Marquer comme mangé"}
                >
                  {meal.consumed ? "✓ Mangé" : "🍽️"}
                </button>
              )}
              <button
                onClick={saveOverrides}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/30 active:scale-[0.99] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    Mettre à jour mon panier ({selectedCount})
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.25s ease-out; }
      `}</style>

      <CookingMode
        open={cookingOpen}
        onClose={() => setCookingOpen(false)}
        title={recipe?.title ?? meal?.title ?? ""}
        instructionsHtml={recipe?.instructions}
        ingredients={recipe?.extendedIngredients?.filter((ing) => !excludedIds.has(ing.id))}
        servings={servings}
      />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-2 text-center">
      <div className="flex items-center justify-center gap-1 text-xs text-gray-500">{icon} {label}</div>
      <div className="font-bold text-sm mt-0.5">{value}</div>
    </div>
  );
}

