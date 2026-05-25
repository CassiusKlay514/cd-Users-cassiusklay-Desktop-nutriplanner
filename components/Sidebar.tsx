"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Baby, Calendar, Camera, ChefHat, History, Home, Package,
  ScanLine, ShoppingBag, Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import MemberSwitcher from "./MemberSwitcher";

interface Tab {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: { title: string; tabs: Tab[] }[] = [
  {
    title: "Mon quotidien",
    tabs: [
      { href: "/", label: "Accueil", icon: Home },
      { href: "/dashboard", label: "Mon suivi", icon: BarChart3 },
    ],
  },
  {
    title: "Cuisine",
    tabs: [
      { href: "/plan", label: "Plan de repas", icon: Calendar },
      { href: "/history", label: "Plans passés", icon: History },
      { href: "/fridge", label: "Photo du frigo", icon: Camera },
      { href: "/recipes", label: "Recettes", icon: ChefHat },
    ],
  },
  {
    title: "Courses",
    tabs: [
      { href: "/shopping", label: "Liste de courses", icon: ShoppingBag },
      { href: "/pantry", label: "Garde-manger", icon: Warehouse },
      { href: "/catalogue", label: "Catalogue", icon: Package },
      { href: "/scan", label: "Scan code-barre", icon: ScanLine },
    ],
  },
  {
    title: "Plus",
    tabs: [{ href: "/kids", label: "Espace enfants", icon: Baby }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  if (
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/share")
  )
    return null;

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0">
      {/* Brand + member */}
      <div className="px-4 pt-5 pb-3 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <Logo size={32} />
          <span className="font-bold text-lg tracking-tight">
            Nutri<span className="text-primary">Planner</span>
          </span>
        </Link>
        <MemberSwitcher />
      </div>

      {/* Nav sections scrollable */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-1 text-[10px] uppercase tracking-wider text-gray-400 font-bold">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.tabs.map((t) => {
                const active =
                  pathname === t.href ||
                  (t.href !== "/" && pathname?.startsWith(t.href));
                const Icon = t.icon;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer mini */}
      <div className="px-4 py-3 border-t border-gray-100 text-[10px] text-gray-400">
        v0.1 · Propulsé par Claude
      </div>
    </aside>
  );
}
