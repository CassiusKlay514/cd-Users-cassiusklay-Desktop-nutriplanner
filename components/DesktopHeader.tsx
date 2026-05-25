"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Accueil", subtitle: "Votre tableau de bord nutrition" },
  "/dashboard": { title: "Mon suivi", subtitle: "Calories, macros, série en cours" },
  "/plan": { title: "Plan de repas", subtitle: "Votre semaine personnalisée" },
  "/history": { title: "Plans passés", subtitle: "Vos archives de menus" },
  "/fridge": { title: "Photo du frigo", subtitle: "Plan généré depuis votre stock" },
  "/recipes": { title: "Recettes", subtitle: "Filtrées selon votre profil" },
  "/shopping": { title: "Liste de courses", subtitle: "Comparée sur 4 enseignes" },
  "/pantry": { title: "Garde-manger", subtitle: "Ce que vous avez déjà chez vous" },
  "/catalogue": { title: "Catalogue", subtitle: "Tout en plus des recettes" },
  "/scan": { title: "Scan code-barre", subtitle: "Identifier un produit" },
  "/family": { title: "Ma famille", subtitle: "Multi-profils sous un compte" },
  "/kids": { title: "Espace enfants", subtitle: "Quiz et recettes rigolotes" },
  "/profile": { title: "Mon profil", subtitle: "Vos préférences et objectifs" },
};

export default function DesktopHeader() {
  const pathname = usePathname();
  if (
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/share")
  )
    return null;

  // Recipe detail
  let titleData = TITLES[pathname ?? "/"];
  if (!titleData && pathname?.startsWith("/recipes/")) {
    titleData = { title: "Recette", subtitle: "Détail" };
  }
  if (!titleData) titleData = { title: "NutriPlanner" };

  return (
    <header className="hidden md:flex items-center justify-between sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 px-8 py-4">
      <div>
        <h1 className="font-bold text-xl tracking-tight">{titleData.title}</h1>
        {titleData.subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{titleData.subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
          aria-label="Rechercher (bientôt)"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
