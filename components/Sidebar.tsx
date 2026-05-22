"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Baby, Calendar, Camera, ChefHat, History, Home, Leaf, Package, ScanLine, ShoppingBag, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import MemberSwitcher from "./MemberSwitcher";

const tabs = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/dashboard", label: "Mon suivi", icon: BarChart3 },
  { href: "/plan", label: "Plan de repas", icon: Calendar },
  { href: "/history", label: "Plans passés", icon: History },
  { href: "/fridge", label: "Photo du frigo", icon: Camera },
  { href: "/recipes", label: "Recettes", icon: ChefHat },
  { href: "/shopping", label: "Liste de courses", icon: ShoppingBag },
  { href: "/pantry", label: "Mon garde-manger", icon: Warehouse },
  { href: "/catalogue", label: "Catalogue", icon: Package },
  { href: "/scan", label: "Scan code-barre", icon: ScanLine },
  { href: "/kids", label: "Espace enfants", icon: Baby },
];

export default function Sidebar() {
  const pathname = usePathname();
  if (pathname?.startsWith("/onboarding") || pathname?.startsWith("/login") || pathname?.startsWith("/share")) return null;

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-gray-200 bg-white p-4 gap-1">
      <div className="flex items-center gap-2 px-2 py-4">
        <Leaf className="w-6 h-6 text-primary" />
        <span className="text-lg font-bold">NutriPlanner</span>
      </div>
      <div className="px-2 mb-2">
        <MemberSwitcher />
      </div>
      {tabs.map((t) => {
        const active = pathname === t.href || (t.href !== "/" && pathname?.startsWith(t.href));
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
              active
                ? "bg-primary/10 text-primary"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <Icon className="w-5 h-5" />
            {t.label}
          </Link>
        );
      })}
    </aside>
  );
}
