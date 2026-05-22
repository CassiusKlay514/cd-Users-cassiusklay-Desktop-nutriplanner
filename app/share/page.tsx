"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Flame, Leaf, Loader2, Sparkles } from "lucide-react";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { fromIso } from "@/lib/utils";
import type { MealPlan, PlannedMeal } from "@/lib/types";

const MOMENT_EMOJI: Record<string, string> = {
  breakfast: "🥐", lunch: "🥗", dinner: "🍲",
};
const MOMENT_LABEL: Record<string, string> = {
  breakfast: "Petit-déj", lunch: "Déjeuner", dinner: "Dîner",
};

function decodePlan(d: string): { plan: MealPlan; senderName?: string } | null {
  try {
    // Décodage UTF-8 safe (inverse de encodeURIComponent + btoa)
    const raw = atob(decodeURIComponent(d));
    const json = decodeURIComponent(
      raw.split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function SharedPlanInner() {
  const sp = useSearchParams();
  const data = useMemo(() => {
    const d = sp.get("d");
    if (!d) return null;
    return decodePlan(d);
  }, [sp]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center">
          <div className="text-5xl mb-3">🤔</div>
          <h1 className="text-xl font-bold">Lien invalide</h1>
          <p className="text-sm text-gray-500 mt-1">Ce lien de plan partagé est expiré ou incorrect.</p>
          <Link href="/" className="mt-4 inline-block text-primary font-semibold">
            Aller sur NutriPlanner →
          </Link>
        </div>
      </div>
    );
  }

  const { plan, senderName } = data;
  const days: Date[] = [];
  const start = fromIso(plan.startDate);
  const end = fromIso(plan.endDate);
  const span = Math.floor((end.getTime() - start.getTime()) / 86400000);
  for (let i = 0; i <= span; i++) days.push(addDays(start, i));

  const mealsByDay = new Map<string, PlannedMeal[]>();
  plan.meals.forEach((m) => {
    const arr = mealsByDay.get(m.date) ?? [];
    arr.push(m);
    mealsByDay.set(m.date, arr);
  });

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="font-bold">NutriPlanner</span>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-primary px-3 py-1.5 rounded-full bg-primary/10"
          >
            Créer mon plan
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 pt-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Plan partagé
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-3">
          {senderName ? `Le plan de ${senderName}` : "Plan de repas partagé"}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Du {format(start, "d MMMM", { locale: fr })} au {format(end, "d MMMM yyyy", { locale: fr })} · {plan.meals.length} repas
        </p>

        {plan.notes && (
          <div className="mt-4 p-3 rounded-2xl bg-primary/5 border border-primary/20 text-sm">
            <div className="font-semibold text-primary text-xs mb-1">Conseil du coach</div>
            <p className="text-gray-700">{plan.notes}</p>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {days.map((d) => {
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const dayMeals = mealsByDay.get(iso) ?? [];
            return (
              <div key={iso}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-base capitalize">
                    {format(d, "EEEE d MMMM", { locale: fr })}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-accent" />
                    {dayMeals.reduce((s, m) => s + m.calories, 0)} kcal
                  </div>
                </div>
                <div className="space-y-2">
                  {dayMeals.map((m) => (
                    <div key={`${m.date}-${m.moment}`} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-200">
                      <div
                        className="w-14 h-14 rounded-xl bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url(${m.image})` }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs uppercase tracking-wide text-primary font-semibold">
                          {MOMENT_EMOJI[m.moment]} {MOMENT_LABEL[m.moment]}
                        </div>
                        <div className="font-semibold leading-tight truncate">{m.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {m.calories} kcal · P{m.protein} · G{m.carbs} · L{m.fat}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-5 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 text-center">
          <Sparkles className="w-7 h-7 mx-auto text-primary" />
          <h2 className="font-bold text-lg mt-2">Envie du même type de plan ?</h2>
          <p className="text-sm text-gray-600 mt-1 mb-3">
            NutriPlanner crée le vôtre en 30 secondes, adapté à votre profil.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-white font-bold"
          >
            Lancer mon plan personnalisé
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SharedPlanPage() {
  return (
    <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mt-20" />}>
      <SharedPlanInner />
    </Suspense>
  );
}
