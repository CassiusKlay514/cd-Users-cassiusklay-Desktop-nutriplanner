"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight, Calendar, Camera, ChefHat, Clock, Flame, Leaf, LogIn,
  ShoppingBag, Sparkles, Target, Utensils,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, isoDate } from "@/lib/utils";
import type { PlannedMeal } from "@/lib/types";

const MOMENT_EMOJI: Record<string, string> = {
  breakfast: "🥐", lunch: "🥗", dinner: "🍲",
};
const MOMENT_LABEL: Record<string, string> = {
  breakfast: "Petit-déj", lunch: "Déjeuner", dinner: "Dîner",
};

export default function Home() {
  const profile = useStore((s) => s.profile);
  const plan = useStore((s) => s.plan);
  const hasHydrated = useStore((s) => s.hasHydrated);
  const pantry = useStore((s) => s.pantry);

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);
  const todayIso = isoDate(today);

  const todayMeals = useMemo(
    () => plan?.meals.filter((m) => m.date === todayIso) ?? [],
    [plan, todayIso]
  );

  // Skeleton initial pendant l'hydratation
  if (!hasHydrated) {
    return (
      <div className="px-5 py-8 md:px-10 md:py-10 max-w-5xl mx-auto">
        <div className="space-y-3">
          <div className="h-8 w-48 skeleton-shimmer rounded" />
          <div className="h-4 w-32 skeleton-shimmer rounded" />
        </div>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-28 skeleton-shimmer rounded-2xl" />
          <div className="h-28 skeleton-shimmer rounded-2xl" />
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // LANDING — pas de profil
  // ────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="px-5 py-8 md:px-10 md:py-12 max-w-5xl mx-auto">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Propulsé par l'IA
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
            Mangez mieux,<br />
            <span className="text-primary">sans y penser.</span>
          </h1>
          <p className="mt-4 text-gray-600 max-w-xl text-base md:text-lg">
            Votre semaine de repas conçue par l'IA, votre liste de courses
            générée automatiquement, vos objectifs nutrition à portée de main.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/30 active:scale-95 transition"
            >
              Créer mon programme
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white border border-gray-200 text-gray-800 font-semibold active:scale-95"
            >
              <LogIn className="w-4 h-4 text-primary" />
              J'ai déjà un compte
            </Link>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Avec un compte, retrouvez votre plan et vos préférences sur tous vos appareils.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12">
          <FeatureCard
            icon={<Calendar className="w-5 h-5" />}
            title="Plan 7 jours"
            text="Calendrier matin, midi, soir adapté à vos objectifs"
          />
          <FeatureCard
            icon={<ChefHat className="w-5 h-5" />}
            title="Recettes en français"
            text="Bibliothèque filtrable par régime et allergies"
          />
          <FeatureCard
            icon={<ShoppingBag className="w-5 h-5" />}
            title="Courses comparées"
            text="4 enseignes en parallèle, vous prenez la moins chère"
          />
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // HOME CONNECTÉ — vrai mini-dashboard
  // ────────────────────────────────────────────────────────────
  const consumed = todayMeals.filter((m) => m.consumed);
  const consumedKcal = consumed.reduce((s, m) => s + m.calories, 0);
  const plannedKcal = todayMeals.reduce((s, m) => s + m.calories, 0);
  const target = profile.caloriesTarget;

  // Prochain repas non mangé
  const nextMeal = todayMeals.find((m) => !m.consumed);
  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Bon matin" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-5xl mx-auto">
      {/* Hero greeting */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
            {format(today, "EEEE d MMMM", { locale: fr })}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">
            {greeting}, {profile.name} 👋
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Objectif : {target} kcal · {consumedKcal} déjà consommés
          </p>
        </div>
        <Link
          href="/plan"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-sm font-semibold shadow-md shadow-primary/30 active:scale-95"
        >
          <Calendar className="w-4 h-4" />
          Voir mon plan
        </Link>
      </div>

      {/* Bloc principal : ring + prochain repas */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ring nutrition */}
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-dark text-white p-5 flex flex-col items-center justify-center shadow-lg shadow-primary/30">
          <div className="text-xs uppercase tracking-wide opacity-80 font-bold">
            Aujourd'hui
          </div>
          <div className="mt-3">
            <RingMini consumed={consumedKcal} target={target} />
          </div>
          <div className="text-xs opacity-90 mt-2">
            {consumedKcal === 0
              ? "À vous de jouer"
              : `${Math.round((consumedKcal / target) * 100)} % de la cible`}
          </div>
        </div>

        {/* Prochain repas / CTA plan */}
        <div className="md:col-span-2">
          {nextMeal ? (
            <Link
              href="/plan"
              className="block rounded-3xl bg-white border border-gray-200 p-4 hover:border-primary/40 transition group h-full"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wide text-primary font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Prochain repas
                </span>
                <span className="text-xs text-gray-500">
                  {MOMENT_EMOJI[nextMeal.moment]} {MOMENT_LABEL[nextMeal.moment]}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-20 h-20 rounded-2xl bg-cover bg-center shrink-0"
                  style={{ backgroundImage: `url(${nextMeal.image})` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base truncate group-hover:text-primary transition">
                    {nextMeal.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-accent" /> {nextMeal.calories} kcal
                    </span>
                    {nextMeal.readyInMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {nextMeal.readyInMinutes} min
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition" />
              </div>
            </Link>
          ) : todayMeals.length > 0 ? (
            <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-4 h-full flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-1">🎉</div>
              <div className="font-bold text-emerald-900">
                Tous les repas du jour sont mangés
              </div>
              <div className="text-xs text-emerald-700 mt-1">
                Continue comme ça, ta série progresse.
              </div>
            </div>
          ) : (
            <Link
              href="/plan"
              className="block rounded-3xl bg-white border border-dashed border-gray-300 p-5 hover:border-primary/40 transition h-full"
            >
              <div className="text-3xl mb-2">📅</div>
              <div className="font-bold">Aucun plan pour aujourd'hui</div>
              <div className="text-xs text-gray-500 mt-1">
                Générez votre plan de la semaine en 30 secondes.
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-primary text-sm font-semibold">
                Lancer la génération <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
        <QuickAction
          href="/shopping"
          icon={<ShoppingBag className="w-4 h-4" />}
          label="Mes courses"
          accent="bg-orange-100 text-orange-700"
        />
        <QuickAction
          href="/fridge"
          icon={<Camera className="w-4 h-4" />}
          label="Photo frigo"
          accent="bg-blue-100 text-blue-700"
        />
        <QuickAction
          href="/recipes"
          icon={<ChefHat className="w-4 h-4" />}
          label="Recettes"
          accent="bg-amber-100 text-amber-700"
        />
        <QuickAction
          href="/pantry"
          icon={<Utensils className="w-4 h-4" />}
          label={`Garde-manger${pantry.length > 0 ? ` (${pantry.length})` : ""}`}
          accent="bg-purple-100 text-purple-700"
        />
      </div>

      {/* Tous les repas du jour */}
      {todayMeals.length > 0 && (
        <section className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Vos repas du jour
            </h2>
            <span className="text-xs text-gray-500">
              {consumed.length}/{todayMeals.length} mangés · {plannedKcal} kcal
            </span>
          </div>
          <div className="space-y-2">
            {todayMeals.map((m) => (
              <MealItem key={`${m.date}-${m.moment}`} meal={m} />
            ))}
          </div>
        </section>
      )}

      {/* Conseil du coach */}
      {plan?.notes && (
        <div className="mt-7 rounded-2xl bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-center gap-2 text-primary font-semibold mb-2 text-sm">
            <Leaf className="w-4 h-4" />
            Le conseil du coach
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {plan.notes}
          </p>
        </div>
      )}
    </div>
  );
}

function FeatureCard({
  icon, title, text,
}: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-4">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div className="mt-3 font-semibold">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{text}</div>
    </div>
  );
}

function QuickAction({
  href, icon, label, accent,
}: { href: string; icon: React.ReactNode; label: string; accent: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white border border-gray-200 p-3 hover:border-primary/40 active:scale-[0.98] transition flex flex-col items-start gap-2"
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", accent)}>
        {icon}
      </div>
      <div className="font-semibold text-xs leading-tight">{label}</div>
    </Link>
  );
}

function MealItem({ meal }: { meal: PlannedMeal }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-2xl border transition",
      meal.consumed ? "bg-primary/5 border-primary/30" : "bg-white border-gray-200"
    )}>
      <div
        className="w-12 h-12 rounded-xl bg-cover bg-center shrink-0"
        style={{ backgroundImage: `url(${meal.image})` }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-primary font-bold">
          {MOMENT_EMOJI[meal.moment]} {MOMENT_LABEL[meal.moment]}
        </div>
        <div className="font-semibold text-sm leading-tight truncate">{meal.title}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {meal.calories} kcal
          {meal.readyInMinutes ? ` · ${meal.readyInMinutes} min` : ""}
        </div>
      </div>
      {meal.consumed && (
        <span className="text-emerald-600 text-xs font-bold shrink-0">✓</span>
      )}
    </div>
  );
}

function RingMini({ consumed, target }: { consumed: number; target: number }) {
  const size = 140;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const offset = c * (1 - pct);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="#fff" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold">{consumed}</div>
        <div className="text-[10px] opacity-80">/ {target} kcal</div>
      </div>
    </div>
  );
}

