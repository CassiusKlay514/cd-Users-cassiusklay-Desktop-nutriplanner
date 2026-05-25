"use client";

import { usePathname } from "next/navigation";
import MemberSwitcher from "./MemberSwitcher";
import Logo from "./Logo";

const TITLES: Record<string, string> = {
  "/": "NutriPlanner",
  "/dashboard": "Mon suivi",
  "/plan": "Mon plan",
  "/history": "Plans passés",
  "/fridge": "Photo du frigo",
  "/recipes": "Recettes",
  "/shopping": "Courses",
  "/pantry": "Garde-manger",
  "/catalogue": "Catalogue",
  "/scan": "Scan",
  "/family": "Ma famille",
  "/kids": "Espace enfants",
  "/profile": "Mon profil",
};

export default function MobileHeader() {
  const pathname = usePathname();
  if (
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/share")
  )
    return null;

  let title = TITLES[pathname ?? "/"];
  if (!title && pathname?.startsWith("/recipes/")) title = "Recette";
  if (!title) title = "NutriPlanner";

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="flex items-center justify-between gap-2 px-4 h-14">
        <div className="flex items-center gap-2 min-w-0">
          <Logo size={24} />
          <h1 className="font-bold text-base truncate">{title}</h1>
        </div>
        <div className="shrink-0">
          <MemberSwitcher />
        </div>
      </div>
    </header>
  );
}
