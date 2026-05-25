"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Clock, Loader2, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import type { MealMoment, PlannedMeal } from "@/lib/types";

const MOMENT_HOURS: { moment: MealMoment; label: string; emoji: string }[] = [
  { moment: "breakfast", label: "Petit-déj", emoji: "🥐" },
  { moment: "lunch", label: "Déj", emoji: "🥗" },
  { moment: "dinner", label: "Dîner", emoji: "🍲" },
];

export default function QuickMealFab() {
  const profile = useStore((s) => s.profile);
  const pantry = useStore((s) => s.pantry);
  const [open, setOpen] = useState(false);
  const [moment, setMoment] = useState<MealMoment>("dinner");
  const [maxMinutes, setMaxMinutes] = useState(20);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<PlannedMeal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  if (
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/share") ||
    pathname?.startsWith("/kids")
  ) return null;

  const generate = async () => {
    if (!profile) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/quick-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          moment,
          maxMinutes,
          availableIngredients: pantry.length ? pantry.map((p) => p.name) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setResult(data.meal as PlannedMeal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-44 md:bottom-24 right-5 z-30 w-14 h-14 rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-400/40 flex items-center justify-center active:scale-95"
        aria-label="Rapide ce soir"
      >
        <Zap className="w-6 h-6" fill="currentColor" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setOpen(false); setResult(null); }} />
          <div className="relative bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl p-5">
            <div className="md:hidden flex justify-center -mt-2 mb-2">
              <div className="w-10 h-1.5 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Zap className="w-5 h-5" fill="currentColor" />
              </div>
              <h2 className="font-bold text-lg">Rapide ce soir</h2>
            </div>
            <p className="text-sm text-gray-500">
              Une suggestion express selon votre garde-manger ({pantry.length} ingrédient{pantry.length > 1 ? "s" : ""}).
            </p>

            {!result && (
              <>
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Pour quel repas ?</div>
                  <div className="grid grid-cols-3 gap-2">
                    {MOMENT_HOURS.map((m) => (
                      <button
                        key={m.moment}
                        onClick={() => setMoment(m.moment)}
                        className={`py-3 rounded-xl border text-sm font-semibold ${
                          moment === m.moment
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-white border-gray-200 text-gray-700"
                        }`}
                      >
                        <div className="text-lg">{m.emoji}</div>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Temps max : {maxMinutes} min
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={45}
                    step={5}
                    value={maxMinutes}
                    onChange={(e) => setMaxMinutes(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <button
                  onClick={generate}
                  disabled={generating}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 text-white font-bold disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" fill="currentColor" />}
                  Suggère-moi une recette
                </button>
                {error && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
                )}
              </>
            )}

            {result && (
              <div className="mt-4">
                <div
                  className="aspect-video rounded-2xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${result.image})` }}
                />
                <h3 className="font-bold text-lg mt-3">{result.title}</h3>
                <div className="text-sm text-gray-500 mt-1">
                  {result.calories} kcal · {result.readyInMinutes ?? "·"} min · P{result.protein}g
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setResult(null); generate(); }}
                    disabled={generating}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 text-sm font-semibold"
                  >
                    Autre proposition
                  </button>
                  <a
                    href={`/recipes/${result.recipeId}`}
                    className="flex-1 py-3 rounded-2xl bg-amber-500 text-white text-sm font-bold text-center"
                  >
                    Voir la recette
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
