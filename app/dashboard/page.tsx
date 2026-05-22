"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Award, Camera, Loader2, Target, TrendingUp,
} from "lucide-react";
import MealPhotoSheet from "@/components/MealPhotoSheet";
import { useStore } from "@/lib/store";
import { cn, fromIso, isoDate } from "@/lib/utils";
import NutritionRing from "@/components/NutritionRing";
import WaterTracker from "@/components/WaterTracker";
import WeightTracker from "@/components/WeightTracker";
import type { PlannedMeal } from "@/lib/types";

const MOMENT_EMOJI: Record<string, string> = {
  breakfast: "🥐", lunch: "🥗", dinner: "🍲",
};

const MOMENT_LABEL: Record<string, string> = {
  breakfast: "Petit-déj", lunch: "Déj", dinner: "Dîner",
};

export default function DashboardPage() {
  const profile = useStore((s) => s.profile);
  const plan = useStore((s) => s.plan);
  const hasHydrated = useStore((s) => s.hasHydrated);
  const toggleConsumed = useStore((s) => s.toggleConsumed);
  const updateMeal = useStore((s) => s.updateMeal);
  const router = useRouter();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [extraLogged, setExtraLogged] = useState<{ kcal: number; protein: number; carbs: number; fat: number; name: string }[]>([]);

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const todayIso = isoDate(today);

  const todayMeals = useMemo(
    () => plan?.meals.filter((m) => m.date === todayIso) ?? [],
    [plan, todayIso]
  );

  const consumed = todayMeals.filter((m) => m.consumed);
  const extraKcal = extraLogged.reduce((s, x) => s + x.kcal, 0);
  const extraProtein = extraLogged.reduce((s, x) => s + x.protein, 0);
  const extraCarbs = extraLogged.reduce((s, x) => s + x.carbs, 0);
  const extraFat = extraLogged.reduce((s, x) => s + x.fat, 0);
  const consumedKcal = consumed.reduce((s, m) => s + m.calories, 0) + extraKcal;
  const consumedProtein = consumed.reduce((s, m) => s + m.protein, 0) + extraProtein;
  const consumedCarbs = consumed.reduce((s, m) => s + m.carbs, 0) + extraCarbs;
  const consumedFat = consumed.reduce((s, m) => s + m.fat, 0) + extraFat;

  const target = profile?.caloriesTarget ?? 2000;

  // Streak : nombre de jours consécutifs incluant aujourd'hui avec >= 2 repas consommés
  const streak = useMemo(() => {
    if (!plan) return 0;
    const byDate = new Map<string, PlannedMeal[]>();
    plan.meals.forEach((m) => {
      const arr = byDate.get(m.date) ?? [];
      arr.push(m);
      byDate.set(m.date, arr);
    });
    let count = 0;
    let d = new Date(today);
    while (true) {
      const iso = isoDate(d);
      const meals = byDate.get(iso) ?? [];
      const consumed = meals.filter((m) => m.consumed).length;
      if (consumed >= 2 || (count === 0 && consumed >= 1)) {
        // Aujourd'hui : tolérant à 1 repas mangé pour démarrer la série
        count++;
        d = addDays(d, -1);
      } else break;
    }
    return count;
  }, [plan, today]);

  // 7 derniers jours
  const last7 = useMemo(() => {
    if (!plan) return [];
    const result: { date: Date; kcal: number; consumed: number; planned: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const iso = isoDate(d);
      const meals = plan.meals.filter((m) => m.date === iso);
      const consumedMeals = meals.filter((m) => m.consumed);
      result.push({
        date: d,
        kcal: consumedMeals.reduce((s, m) => s + m.calories, 0),
        consumed: consumedMeals.length,
        planned: meals.length,
      });
    }
    return result;
  }, [plan, today]);

  // Badges débloqués (logique simple)
  const badges = useMemo(() => {
    const list: { id: string; emoji: string; label: string; unlocked: boolean }[] = [
      { id: "first", emoji: "🌱", label: "Premier plan", unlocked: !!plan },
      { id: "first_meal", emoji: "🍴", label: "Premier repas mangé", unlocked: plan?.meals.some((m) => m.consumed) ?? false },
      { id: "streak3", emoji: "🔥", label: "3 jours suivis", unlocked: streak >= 3 },
      { id: "streak7", emoji: "🚀", label: "1 semaine de suite", unlocked: streak >= 7 },
      { id: "streak30", emoji: "👑", label: "30 jours de suite", unlocked: streak >= 30 },
    ];
    return list;
  }, [plan, streak]);

  if (!hasHydrated) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return (
      <div className="px-5 py-20 text-center">
        <h2 className="font-bold text-lg">Pas de profil</h2>
        <Link href="/onboarding" className="text-primary text-sm mt-2 inline-block">Commencer</Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Aujourd'hui</h1>
          <p className="text-gray-600 text-sm mt-1 capitalize">
            {format(today, "EEEE d MMMM", { locale: fr })}
          </p>
        </div>
        <button
          onClick={() => setPhotoOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary text-white text-sm font-semibold shadow-md shadow-primary/30"
        >
          <Camera className="w-4 h-4" /> Photo plat
        </button>
      </div>

      <MealPhotoSheet
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        onLog={(d) => {
          setExtraLogged((prev) => [...prev, {
            kcal: d.calories, protein: d.protein, carbs: d.carbs, fat: d.fat, name: d.dishName,
          }]);
        }}
      />

      {/* Ring + streak */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="flex flex-col items-center sm:col-span-1">
          <NutritionRing consumed={consumedKcal} target={target} label="consommé" />
        </div>
        <div className="sm:col-span-2 grid grid-cols-3 gap-2">
          <Macro label="Protéines" v={consumedProtein} target={Math.round(target * 0.25 / 4)} color="bg-blue-500" />
          <Macro label="Glucides" v={consumedCarbs} target={Math.round(target * 0.5 / 4)} color="bg-amber-500" />
          <Macro label="Lipides" v={consumedFat} target={Math.round(target * 0.25 / 9)} color="bg-rose-500" />
          <div className="col-span-3 rounded-2xl bg-white border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl">
              🔥
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-gray-500">Série en cours</div>
              <div className="font-bold text-lg">
                {streak} jour{streak !== 1 ? "s" : ""} de suite
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Repas du jour */}
      <section className="mt-7">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Vos repas du jour
        </h2>
        {todayMeals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500 text-sm">
            Aucun repas prévu aujourd'hui.{" "}
            <button onClick={() => router.push("/plan")} className="text-primary font-semibold underline">
              Générez un plan
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayMeals.map((m) => (
              <div
                key={`${m.moment}`}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border transition",
                  m.consumed ? "bg-primary/5 border-primary/30" : "bg-white border-gray-200"
                )}
              >
                <div
                  className="w-14 h-14 rounded-xl bg-cover bg-center shrink-0"
                  style={{ backgroundImage: `url(${m.image})` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">
                    {MOMENT_EMOJI[m.moment]} {MOMENT_LABEL[m.moment]}
                  </div>
                  <div className="font-semibold text-sm truncate">{m.title}</div>
                  <div className="text-xs text-gray-500">
                    {m.calories} kcal · {m.readyInMinutes ?? "—"} min
                  </div>
                </div>
                <button
                  onClick={() => toggleConsumed(m.date, m.moment)}
                  className={cn(
                    "shrink-0 px-3 py-2 rounded-full text-xs font-bold border transition",
                    m.consumed
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-700 border-gray-200"
                  )}
                >
                  {m.consumed ? "✓ Mangé" : "Mangé ?"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Eau + poids */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WaterTracker />
        <WeightTracker />
      </div>

      {/* 7 jours */}
      <section className="mt-7">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Cette semaine
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-end justify-between gap-1 h-32">
            {last7.map((d, i) => {
              const max = Math.max(...last7.map((x) => x.kcal), target);
              const heightPct = max > 0 ? (d.kcal / max) * 100 : 0;
              const isToday = i === last7.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] text-gray-500 font-bold">{d.kcal > 0 ? d.kcal : ""}</div>
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-all",
                        d.consumed === d.planned && d.planned > 0
                          ? "bg-primary"
                          : "bg-primary/30",
                        isToday && "ring-2 ring-primary"
                      )}
                      style={{ height: `${heightPct}%`, minHeight: d.kcal > 0 ? 4 : 0 }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    {format(d.date, "EEE", { locale: fr }).substring(0, 1)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Barre pleine = tous les repas mangés. Sinon partielle.
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="mt-7">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" /> Vos badges
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {badges.map((b) => (
            <div
              key={b.id}
              className={cn(
                "rounded-2xl p-3 text-center border",
                b.unlocked
                  ? "bg-white border-primary/30"
                  : "bg-gray-50 border-gray-200 opacity-50"
              )}
            >
              <div className="text-3xl">{b.emoji}</div>
              <div className="text-[10px] mt-1 font-medium">{b.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Macro({ label, v, target, color }: { label: string; v: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(v / target, 1) : 0;
  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-500">
        <span className={`w-2 h-2 rounded-full ${color}`} /> {label}
      </div>
      <div className="font-bold text-base mt-1">
        {v}<span className="text-gray-400 font-normal text-xs">/{target}g</span>
      </div>
      <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={color} style={{ width: `${pct * 100}%`, height: "100%" }} />
      </div>
    </div>
  );
}
