"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check, Loader2, Minus, Plus, Search, ShoppingBag, Sparkles, TrendingDown, Wine,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { cn, ensureDietPrefs } from "@/lib/utils";
import {
  ALCOHOL_CATEGORIES, CATALOG, CATEGORY_EMOJIS, CATEGORY_LABELS,
  listByCategory, type CatalogCategory, type CatalogProduct,
} from "@/lib/catalog";
import type { PricedIngredient } from "@/lib/openprices";

const RETAILERS = [
  { name: "Carrefour", color: "bg-blue-600" },
  { name: "Auchan", color: "bg-red-600" },
  { name: "Leclerc", color: "bg-amber-500" },
  { name: "Amazon Fresh", color: "bg-zinc-900" },
];

interface WinePairing {
  date: string;
  meal: string;
  wineType: string;
  suggestion: string;
  reason: string;
  priceRange: string;
}

export default function CataloguePage() {
  const profile = useStore((s) => s.profile);
  const plan = useStore((s) => s.plan);
  const customItems = useStore((s) => s.customItems);
  const addCustomItem = useStore((s) => s.addCustomItem);
  const removeCustomItem = useStore((s) => s.removeCustomItem);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CatalogCategory | "all">("all");
  const [prices, setPrices] = useState<Record<string, PricedIngredient>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pairings, setPairings] = useState<WinePairing[]>([]);
  const [pairingsLoading, setPairingsLoading] = useState(false);

  // Cacher l'alcool selon les préférences (halal, sans alcool, etc.)
  const hideAlcohol = useMemo(() => {
    if (!profile) return false;
    const prefs = ensureDietPrefs(profile);
    if (prefs.religiousDiet === "halal") return true;
    if (prefs.exclusions.includes("alcohol")) return true;
    // Bébé / enfant : on cache aussi
    if (profile.role === "child" || profile.role === "baby") return true;
    return false;
  }, [profile]);

  const visibleCatalog = useMemo(
    () => CATALOG.filter((p) => !hideAlcohol || !ALCOHOL_CATEGORIES.includes(p.category)),
    [hideAlcohol]
  );

  const grouped = useMemo(() => {
    const map = new Map<CatalogCategory, CatalogProduct[]>();
    visibleCatalog.forEach((p) => {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    });
    return Array.from(map.entries()).map(([category, products]) => ({ category, products }));
  }, [visibleCatalog]);

  const filtered = useMemo(() => {
    return visibleCatalog.filter((p) => {
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [activeCategory, query, visibleCatalog]);

  // Charge les prix au montage (instant, estimés)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setPricesLoading(true);
      try {
        const res = await fetch("/api/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingredients: visibleCatalog.map((p) => p.name) }),
        });
        const data = await res.json();
        const dict: Record<string, PricedIngredient> = {};
        (data.prices as PricedIngredient[])?.forEach((p) => { dict[p.name] = p; });
        if (!cancelled) setPrices(dict);
      } catch { /* silent */ } finally {
        if (!cancelled) setPricesLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [visibleCatalog]);

  // Accords mets/vins quand l'utilisateur a un plan
  const requestPairings = async () => {
    if (!plan?.meals.length) return;
    setPairingsLoading(true);
    try {
      const res = await fetch("/api/wine-pairing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals: plan.meals }),
      });
      const data = await res.json();
      setPairings((data.pairings as WinePairing[]) ?? []);
    } finally {
      setPairingsLoading(false);
    }
  };

  const addedNames = useMemo(() => new Set(customItems.map((i) => i.name)), [customItems]);

  const getQty = (id: string) => quantities[id] ?? 1;
  const setQty = (id: string, q: number) => setQuantities((prev) => ({ ...prev, [id]: Math.max(0, q) }));

  const handleAdd = (p: CatalogProduct) => {
    const isAdded = addedNames.has(p.name);
    if (isAdded) {
      const existing = customItems.find((i) => i.name === p.name);
      if (existing) {
        removeCustomItem(existing.id);
        toast.success(`${p.name} retiré du panier`);
      }
    } else {
      addCustomItem({
        name: p.name,
        category: p.category === "frozen_misc" || p.category === "fresh_misc"
          ? "other" : p.category as never,
        emoji: p.emoji,
        quantity: getQty(p.id),
        unit: p.defaultPack,
        checked: false,
      });
      toast.success(`${p.emoji} ${p.name} ajouté au panier`);
    }
  };

  // Totaux par enseigne
  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    RETAILERS.forEach((r) => (t[r.name] = 0));
    customItems.filter((i) => !i.checked).forEach((it) => {
      const p = prices[it.name];
      if (!p) return;
      RETAILERS.forEach((r) => {
        const rp = p.prices.find((x) => x.retailer === r.name);
        if (rp) t[r.name] += rp.price * it.quantity;
      });
    });
    return t;
  }, [customItems, prices]);

  const cheapest = useMemo(() => {
    const entries = Object.entries(totals).filter(([, v]) => v > 0);
    if (!entries.length) return null;
    return entries.reduce((a, b) => (a[1] < b[1] ? a : b))[0];
  }, [totals]);

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-5xl mx-auto pb-28">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Catalogue</h1>
      <p className="text-gray-600 text-sm mt-1">
        Tout ce qu'il faut en plus des recettes. Prix comparés sur 4 enseignes.
      </p>

      {/* Totaux + comparateur */}
      {customItems.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5" />
            Total catalogue ({customItems.length} produit{customItems.length > 1 ? "s" : ""})
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {RETAILERS.map((r) => {
              const total = totals[r.name];
              const isCheap = cheapest === r.name && total > 0;
              return (
                <div
                  key={r.name}
                  className={cn(
                    "p-3 rounded-2xl border bg-white relative",
                    isCheap ? "border-primary ring-2 ring-primary/30" : "border-gray-200"
                  )}
                >
                  {isCheap && (
                    <span className="absolute -top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      MOINS CHER
                    </span>
                  )}
                  <div className={cn("w-2.5 h-2.5 rounded-full", r.color)} />
                  <div className="font-semibold text-sm mt-2">{r.name}</div>
                  <div className="text-lg font-bold mt-0.5">
                    {total > 0 ? `${total.toFixed(2)} €` : "·"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accord mets/vins */}
      {plan && plan.meals.some((m) => m.moment === "dinner") && !hideAlcohol && (
        <div className="mt-5">
          <div className="rounded-3xl bg-gradient-to-br from-rose-600 to-purple-700 text-white p-5 shadow-xl shadow-purple-300/30">
            <div className="flex items-center gap-2 mb-2">
              <Wine className="w-5 h-5" />
              <span className="font-bold">Accord mets / vins</span>
            </div>
            <p className="text-sm opacity-90">
              Notre sommelier IA propose une suggestion pour chacun de vos dîners.
            </p>
            {pairings.length === 0 ? (
              <button
                onClick={requestPairings}
                disabled={pairingsLoading}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-purple-700 font-bold text-sm disabled:opacity-50"
              >
                {pairingsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Suggérer mes vins
              </button>
            ) : (
              <div className="mt-4 space-y-2">
                {pairings.map((p, i) => (
                  <div key={i} className="bg-white/15 backdrop-blur rounded-2xl p-3">
                    <div className="text-[10px] uppercase tracking-wide opacity-80">
                      {p.date} · {p.meal}
                    </div>
                    <div className="font-bold mt-0.5">{p.suggestion}</div>
                    <div className="text-xs opacity-90 mt-1">{p.reason}</div>
                    <div className="text-[10px] opacity-70 mt-1">{p.priceRange}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recherche */}
      <div className="mt-5 relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-gray-200 text-sm"
        />
      </div>

      {/* Filtres catégories */}
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 md:mx-0 md:px-0 pb-1">
        <CatBtn label="Tout" emoji="✨" active={activeCategory === "all"} onClick={() => setActiveCategory("all")} />
        {grouped.map((g) => (
          <CatBtn
            key={g.category}
            label={CATEGORY_LABELS[g.category]}
            emoji={CATEGORY_EMOJIS[g.category]}
            active={activeCategory === g.category}
            onClick={() => setActiveCategory(g.category)}
          />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {filtered.map((p) => {
          const added = addedNames.has(p.name);
          const ip = prices[p.name];
          const cheapPrice = ip ? Math.min(...ip.prices.map((x) => x.price)) : null;
          const qty = getQty(p.id);
          return (
            <div
              key={p.id}
              className={cn(
                "bg-white rounded-2xl border p-3 transition",
                added ? "border-primary bg-primary/5" : "border-gray-200"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl shrink-0">{p.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{p.name}</div>
                  {p.defaultPack && (
                    <div className="text-[10px] text-gray-500">{p.defaultPack}</div>
                  )}
                </div>
                <button
                  onClick={() => handleAdd(p)}
                  className={cn(
                    "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    added ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {added ? <Check className="w-4 h-4" strokeWidth={3} /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {ip && (
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {RETAILERS.map((r) => {
                    const rp = ip.prices.find((x) => x.retailer === r.name);
                    const isMin = rp && cheapPrice !== null && rp.price === cheapPrice;
                    return (
                      <div
                        key={r.name}
                        className={cn(
                          "px-1 py-1 rounded text-[10px] text-center",
                          isMin ? "bg-primary/10 text-primary font-bold" : "bg-gray-50 text-gray-500"
                        )}
                      >
                        <div className="font-semibold truncate">{r.name.split(" ")[0]}</div>
                        <div>{rp ? `${rp.price.toFixed(2)}€` : "·"}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {added && (
                <div className="mt-2 flex items-center justify-between bg-white rounded-xl border border-gray-200 px-2 py-1">
                  <span className="text-xs text-gray-500">Quantité</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(p.id, qty - 1)} className="w-7 h-7 rounded-full bg-gray-100">
                      <Minus className="w-3 h-3 mx-auto" />
                    </button>
                    <span className="font-bold text-sm w-5 text-center">{qty}</span>
                    <button onClick={() => setQty(p.id, qty + 1)} className="w-7 h-7 rounded-full bg-gray-100">
                      <Plus className="w-3 h-3 mx-auto" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pricesLoading && customItems.length === 0 && (
        <div className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Calcul des prix…
        </div>
      )}

      {customItems.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-5 right-5 max-w-md mx-auto z-30">
          <a
            href="/shopping"
            className="flex items-center justify-between gap-2 px-5 py-3.5 rounded-full bg-primary text-white font-bold shadow-xl shadow-primary/30"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              {customItems.length} dans le panier {cheapest && `· ${totals[cheapest].toFixed(2)}€ chez ${cheapest}`}
            </span>
            <span>→</span>
          </a>
        </div>
      )}
    </div>
  );
}

function CatBtn({
  label, emoji, active, onClick,
}: { label: string; emoji: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold border flex items-center gap-1.5",
        active ? "bg-primary text-white border-primary shadow-md shadow-primary/30" : "bg-white border-gray-200 text-gray-700"
      )}
    >
      <span>{emoji}</span>
      {label}
    </button>
  );
}
