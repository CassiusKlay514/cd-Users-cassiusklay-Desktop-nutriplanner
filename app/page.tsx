"use client";

import { useStore } from "@/lib/store";
import Link from "next/link";
import {
  ArrowRight, Calendar, ChefHat, Leaf, LogIn, ShoppingBag, Sparkles,
} from "lucide-react";

export default function Home() {
  const profile = useStore((s) => s.profile);
  const plan = useStore((s) => s.plan);

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

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold">
        Salut {profile.name} 👋
      </h1>
      <p className="text-gray-600 mt-1">
        Objectif : {profile.caloriesTarget} kcal par jour
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        <Link
          href="/plan"
          className="rounded-2xl p-5 bg-primary text-white shadow-lg shadow-primary/20 flex items-center justify-between active:scale-[0.98] transition"
        >
          <div>
            <div className="text-sm opacity-90">Mon plan</div>
            <div className="font-semibold text-lg mt-1">
              {plan ? "Voir la semaine" : "Générer mon plan 7 jours"}
            </div>
          </div>
          <Calendar className="w-8 h-8 opacity-80" />
        </Link>

        <Link
          href="/shopping"
          className="rounded-2xl p-5 bg-white border border-gray-200 flex items-center justify-between active:scale-[0.98] transition"
        >
          <div>
            <div className="text-sm text-gray-500">Liste de courses</div>
            <div className="font-semibold text-lg mt-1">
              {plan ? "Préparer mes courses" : "À débloquer"}
            </div>
          </div>
          <ShoppingBag className="w-8 h-8 text-accent" />
        </Link>

        <Link
          href="/recipes"
          className="rounded-2xl p-5 bg-white border border-gray-200 flex items-center justify-between active:scale-[0.98] transition sm:col-span-2"
        >
          <div>
            <div className="text-sm text-gray-500">Bibliothèque</div>
            <div className="font-semibold text-lg mt-1">Explorer les recettes</div>
          </div>
          <ChefHat className="w-8 h-8 text-primary" />
        </Link>
      </div>

      {plan?.notes && (
        <div className="mt-6 rounded-2xl bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-primary font-semibold mb-1">
            <Leaf className="w-4 h-4" />
            Le conseil du coach
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.notes}</p>
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
