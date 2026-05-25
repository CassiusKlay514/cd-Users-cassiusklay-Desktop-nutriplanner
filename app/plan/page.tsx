"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addDays, differenceInDays, format, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays, Camera, ChefHat, ChevronRight, Flame, Grid3x3, Layers, Loader2, RefreshCw, Sparkles, Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { cn, fromIso, isoDate } from "@/lib/utils";
import DateRangePicker from "@/components/DateRangePicker";
import RecipeSheet from "@/components/RecipeSheet";
import ShareButton from "@/components/ShareButton";
import MealActions from "@/components/MealActions";
import type { MealMoment, MealPlan, PlannedMeal } from "@/lib/types";

const MOMENTS: { key: MealMoment; label: string; emoji: string }[] = [
  { key: "breakfast", label: "Petit-déj", emoji: "🥐" },
  { key: "lunch", label: "Déjeuner", emoji: "🥗" },
  { key: "dinner", label: "Dîner", emoji: "🍲" },
];

export default function PlanPage() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const plan = useStore((s) => s.plan);
  const setPlan = useStore((s) => s.setPlan);
  const hasHydrated = useStore((s) => s.hasHydrated);
  const history = useStore((s) => s.history);
  const pantry = useStore((s) => s.pantry);

  const [start, setStart] = useState(() => {
    if (plan) return fromIso(plan.startDate);
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [end, setEnd] = useState(() => {
    if (plan) return fromIso(plan.endDate);
    return addDays(new Date(), 6);
  });
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(isoDate(start));
  const [sheetMeal, setSheetMeal] = useState<PlannedMeal | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [batchMode, setBatchMode] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);

  const handleSwap = (newMeal: PlannedMeal) => {
    if (!plan) return;
    const updated: MealPlan = {
      ...plan,
      meals: plan.meals.map((m) =>
        m.date === newMeal.date && m.moment === newMeal.moment ? newMeal : m
      ),
    };
    setPlan(updated);
  };

  useEffect(() => {
    if (hasHydrated && !profile) router.push("/onboarding");
  }, [hasHydrated, profile, router]);

  const days = useMemo(() => {
    const out: Date[] = [];
    const span = differenceInDays(end, start);
    for (let i = 0; i <= span; i++) out.push(addDays(start, i));
    return out;
  }, [start, end]);

  const mealsByDay = useMemo(() => {
    const map = new Map<string, PlannedMeal[]>();
    plan?.meals.forEach((m) => {
      const arr = map.get(m.date) ?? [];
      arr.push(m);
      map.set(m.date, arr);
    });
    return map;
  }, [plan]);

  const dayMeals = mealsByDay.get(selectedDay) ?? [];
  const dayKcal = dayMeals.reduce((s, m) => s + m.calories, 0);

  const archiveCurrentPlan = useStore((s) => s.archiveCurrentPlan);

  const generate = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    // Archive le plan actuel avant régénération
    if (plan) archiveCurrentPlan();
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          startDate: isoDate(start),
          endDate: isoDate(end),
          history,
          pantryNames: pantry.map((p) => p.name),
          batchMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec génération");
      setPlan(data.plan as MealPlan);
      setSelectedDay(data.plan.startDate);
      toast.success("Plan généré", {
        description: `${(data.plan as MealPlan).meals.length} repas sur ${days.length} jours`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setError(msg);
      toast.error("Échec de la génération", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!hasHydrated) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (!profile) return null;

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mon plan de repas</h1>
          <p className="text-gray-600 text-sm mt-1">
            Du {format(start, "EEEE d MMM", { locale: fr })} au {format(end, "EEEE d MMM", { locale: fr })}
            <span className="ml-2 text-primary font-semibold">
              {days.length} jour{days.length > 1 ? "s" : ""}
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {plan && (
            <div className="inline-flex p-0.5 rounded-full bg-gray-100">
              <button
                onClick={() => setViewMode("week")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1",
                  viewMode === "week" ? "bg-white shadow-sm text-primary" : "text-gray-500"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                Semaine
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1",
                  viewMode === "month" ? "bg-white shadow-sm text-primary" : "text-gray-500"
                )}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
                Mois
              </button>
            </div>
          )}
          <button
            onClick={() => setShowPicker((s) => !s)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-semibold"
          >
            <CalendarDays className="w-4 h-4" />
            Plage
          </button>
          {plan && <ShareButton />}
        </div>
      </div>

      {showPicker && (
        <div className="mt-4">
          <DateRangePicker
            start={start}
            end={end}
            onChange={(s, e) => {
              setStart(s);
              setEnd(e);
              setSelectedDay(isoDate(s));
              setShowPicker(false);
            }}
          />
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Génération en cours…
            </>
          ) : plan ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Régénérer
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Générer mon plan
            </>
          )}
        </button>
        <button
          onClick={() => setBatchMode((b) => !b)}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border",
            batchMode
              ? "bg-emerald-500 text-white border-emerald-500"
              : "bg-white text-gray-700 border-gray-200"
          )}
        >
          <ChefHat className="w-4 h-4" />
          {batchMode ? "Batch cooking ✓" : "Mode batch cooking"}
        </button>
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        <Link
          href="/fridge"
          className="mt-3 w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-700"
        >
          <Camera className="w-4 h-4 text-primary" />
          ou partir d'une photo de mon frigo
        </Link>
      </div>

      {plan && (
        <>
          {plan.notes && (
            <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/20 p-4 text-sm">
              <div className="font-semibold text-primary mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Conseil du coach
              </div>
              <p className="text-gray-700">{plan.notes}</p>
            </div>
          )}
        </>
      )}

      {/* Vue mensuelle */}
      {plan && viewMode === "month" && (
        <MonthView
          startDate={fromIso(plan.startDate)}
          endDate={fromIso(plan.endDate)}
          mealsByDay={mealsByDay}
          target={profile.caloriesTarget}
          onDayClick={(iso) => { setSelectedDay(iso); setViewMode("week"); }}
        />
      )}

      {/* Vue semaine */}
      {plan && viewMode === "week" && (
        <>
          <div
            ref={carouselRef}
            className="mt-6 -mx-5 md:mx-0 px-5 md:px-0 flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory"
          >
            {days.map((d) => {
              const iso = isoDate(d);
              const active = iso === selectedDay;
              const dayCount = mealsByDay.get(iso)?.length ?? 0;
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDay(iso)}
                  className={cn(
                    "shrink-0 snap-start w-16 md:w-20 py-3 rounded-2xl border text-center transition",
                    active
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                      : "bg-white border-gray-200 text-gray-700"
                  )}
                >
                  <div className="text-[10px] uppercase tracking-wide opacity-80">
                    {format(d, "EEE", { locale: fr })}
                  </div>
                  <div className="text-xl font-bold mt-0.5">{d.getDate()}</div>
                  <div className={cn(
                    "text-[10px] mt-1",
                    active ? "text-white/80" : "text-gray-400"
                  )}>
                    {dayCount}/3
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-lg">
                  {format(fromIso(selectedDay), "EEEE d MMMM", { locale: fr })}
                </h2>
                <p className="text-sm text-gray-500">
                  Cible : {profile.caloriesTarget} kcal
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Total estimé</div>
                <div className="font-bold text-lg flex items-center gap-1">
                  <Flame className="w-4 h-4 text-accent" />
                  {dayKcal} <span className="text-sm font-normal text-gray-500">kcal</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {MOMENTS.map((m) => {
                const meal = dayMeals.find((x) => x.moment === m.key);
                return (
                  <MealRow
                    key={m.key}
                    moment={m}
                    meal={meal}
                    onClick={() => meal && setSheetMeal(meal)}
                  />
                );
              })}
            </div>

            <Link
              href="/shopping"
              className="mt-5 w-full inline-flex items-center justify-between gap-2 px-5 py-4 rounded-2xl bg-accent text-white font-semibold shadow-lg shadow-accent/30 active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Préparer la liste de courses
              </span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </>
      )}

      {!plan && !loading && (
        <div className="mt-10 text-center py-12 px-4 rounded-3xl bg-white border border-dashed border-gray-300">
          <div className="text-5xl mb-3">🥗</div>
          <h3 className="font-bold text-lg">Aucun plan pour le moment</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
            Choisissez votre plage de dates ci-dessus puis lancez la génération.
          </p>
        </div>
      )}

      <RecipeSheet
        open={!!sheetMeal}
        onClose={() => setSheetMeal(null)}
        meal={sheetMeal}
        onSwapped={handleSwap}
      />
    </div>
  );
}

function MonthView({
  startDate, endDate, mealsByDay, target, onDayClick,
}: {
  startDate: Date;
  endDate: Date;
  mealsByDay: Map<string, PlannedMeal[]>;
  target: number;
  onDayClick: (iso: string) => void;
}) {
  const anchor = startOfMonth(startDate);
  const grid: Date[] = [];
  const startOffset = (anchor.getDay() + 6) % 7;
  const gridStart = addDays(anchor, -startOffset);
  for (let i = 0; i < 42; i++) grid.push(addDays(gridStart, i));

  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="font-bold capitalize">
          {format(anchor, "MMMM yyyy", { locale: fr })}
        </div>
        <div className="text-xs text-gray-500">
          {Array.from(mealsByDay.keys()).length} jours planifiés
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[10px] text-gray-500 px-1 pt-2">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-1">
        {grid.map((d, i) => {
          const iso = isoDate(d);
          const inPlan = d >= startDate && d <= endDate;
          const meals = mealsByDay.get(iso) ?? [];
          const consumed = meals.filter((m) => m.consumed).length;
          const kcal = meals.reduce((s, m) => s + m.calories, 0);
          const otherMonth = d.getMonth() !== anchor.getMonth();
          const isToday = isoDate(new Date()) === iso;
          const ratio = kcal / target;
          const ratioColor =
            ratio === 0 ? "text-gray-300" :
            ratio < 0.8 ? "text-amber-500" :
            ratio > 1.15 ? "text-rose-500" :
            "text-emerald-600";
          return (
            <button
              key={i}
              onClick={() => meals.length > 0 && onDayClick(iso)}
              disabled={!inPlan || meals.length === 0}
              className={cn(
                "aspect-square p-1 rounded-lg border text-left transition",
                inPlan && meals.length > 0
                  ? "bg-white border-gray-200 hover:border-primary/40 active:scale-95"
                  : "bg-gray-50 border-transparent",
                otherMonth && "opacity-40",
                isToday && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-start justify-between">
                <span className={cn("text-xs font-bold", otherMonth && "text-gray-400")}>
                  {d.getDate()}
                </span>
                {meals.length > 0 && (
                  <span className="text-[8px] text-gray-400">
                    {consumed}/{meals.length}
                  </span>
                )}
              </div>
              {meals.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {meals.map((m, j) => (
                    <div
                      key={j}
                      className="flex-1 h-3 rounded-sm bg-cover bg-center"
                      style={{ backgroundImage: `url(${m.image})` }}
                      title={m.title}
                    />
                  ))}
                </div>
              )}
              {kcal > 0 && (
                <div className={cn("text-[8px] font-semibold mt-0.5", ratioColor)}>
                  {kcal}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 text-[10px] text-gray-400 flex flex-wrap items-center gap-3 border-t border-gray-100">
        <span><span className="text-emerald-600 font-bold">●</span> dans la cible</span>
        <span><span className="text-amber-500 font-bold">●</span> sous la cible</span>
        <span><span className="text-rose-500 font-bold">●</span> au-dessus</span>
        <span className="ml-auto">Cliquez sur un jour pour voir le détail</span>
      </div>
    </div>
  );
}

function MealRow({
  moment, meal, onClick,
}: {
  moment: { key: MealMoment; label: string; emoji: string };
  meal?: PlannedMeal;
  onClick?: () => void;
}) {
  if (!meal) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-dashed border-gray-200">
        <div className="text-3xl">{moment.emoji}</div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide text-gray-400">{moment.label}</div>
          <div className="text-gray-400">À générer</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-gray-200">
      <button
        onClick={onClick}
        className="flex items-center gap-3 flex-1 min-w-0 text-left active:scale-[0.99]"
      >
        <div
          className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url(${meal.image})` }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="text-xs uppercase tracking-wide text-primary font-semibold">
              {moment.emoji} {moment.label}
            </div>
            {meal.guestCount && meal.guestCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                👥 {meal.guestCount}
              </span>
            )}
            {meal.consumed && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                ✓ Mangé
              </span>
            )}
            {meal.rating && (
              <span className="text-[10px] text-amber-600">
                {"⭐".repeat(meal.rating)}
              </span>
            )}
          </div>
          <div className="font-semibold leading-tight truncate">{meal.title}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {meal.calories} kcal · P{meal.protein} · G{meal.carbs} · L{meal.fat}
            {meal.readyInMinutes ? ` · ${meal.readyInMinutes} min` : ""}
          </div>
        </div>
      </button>
      <MealActions meal={meal} />
    </div>
  );
}
