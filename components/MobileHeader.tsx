"use client";

import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";
import MemberSwitcher from "./MemberSwitcher";

const titles: Record<string, string> = {
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
  if (pathname?.startsWith("/onboarding") || pathname?.startsWith("/login") || pathname?.startsWith("/share")) return null;
  const title = titles[pathname ?? "/"] ?? "NutriPlanner";
  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="flex items-center justify-between gap-2 px-4 h-14">
        <div className="flex items-center gap-2 min-w-0">
          <Leaf className="w-5 h-5 text-primary shrink-0" />
          <h1 className="font-bold text-base truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <MemberSwitcher />
        </div>
      </div>
    </header>
  );
}
