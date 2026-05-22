"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Calendar, ChefHat, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Suivi", icon: BarChart3 },
  { href: "/plan", label: "Plan", icon: Calendar },
  { href: "/recipes", label: "Recettes", icon: ChefHat },
  { href: "/shopping", label: "Courses", icon: ShoppingBag },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/onboarding") || pathname?.startsWith("/share")) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 safe-bottom md:hidden"
      aria-label="Navigation principale"
    >
      <ul className="flex justify-around">
        {tabs.map((t) => {
          const active = pathname === t.href || (t.href !== "/" && pathname?.startsWith(t.href));
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs font-medium",
                  active ? "text-primary" : "text-gray-500"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
