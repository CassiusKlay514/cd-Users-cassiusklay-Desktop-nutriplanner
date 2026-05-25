"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check, ExternalLink, Info, Loader2, Package, Sparkles, TrendingDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ShoppingItem } from "@/lib/types";
import type { PricedIngredient } from "@/lib/openprices";

const RETAILERS = [
  { name: "Carrefour", color: "bg-blue-600", url: "https://www.carrefour.fr/s?q=" },
  { name: "Auchan", color: "bg-red-600", url: "https://www.auchan.fr/recherche?text=" },
  { name: "Leclerc", color: "bg-amber-500", url: "https://www.leclercdrive.fr/recherche?q=" },
  { name: "Amazon Fresh", color: "bg-zinc-900", url: "https://www.amazon.fr/s?k=" },
];

const CATEGORY_ICONS: Record<string, string> = {
  fresh: "🥬", cold: "🥩", frozen: "❄️", pantry: "🥫", spice: "🌶️",
};

const CATEGORY_LABELS: Record<string, string> = {
  fresh: "Fruits et légumes",
  cold: "Frais (viande, poisson, crémerie)",
  frozen: "Surgelés",
  pantry: "Placard",
  spice: "Épices et aromates",
};

export default function ShoppingPage() {
  const plan = useStore((s) => s.plan);
  const shopping = useStore((s) => s.shopping);
  const setShopping = useStore((s) => s.setShopping);
  const toggleItem = useStore((s) => s.toggleItem);
  const customItems = useStore((s) => s.customItems);
  const toggleCustomItem = useStore((s) => s.toggleCustomItem);
  const removeCustomItem = useStore((s) => s.removeCustomItem);
  const pantry = useStore((s) => s.pantry);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, PricedIngredient>>({});
  const [pricesLoading, setPricesLoading] = useState(false);

  const generate = async () => {
    if (!plan?.meals.length) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meals: plan.meals,
          pantryNames: pantry.map((p) => p.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setShopping(data.items as ShoppingItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (plan && shopping.length === 0) generate();
  }, [plan?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPrices = async (enrich = false) => {
    if (!shopping.length) return;
    setPricesLoading(true);
    try {
      const names = shopping.filter((i) => !i.optional).map((i) => i.name);
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: names, enrich }),
      });
      const data = await res.json();
      const dict: Record<string, PricedIngredient> = {};
      (data.prices as PricedIngredient[])?.forEach((p) => { dict[p.name] = p; });
      setPrices(dict);
    } catch { /* silent */ } finally {
      setPricesLoading(false);
    }
  };

  useEffect(() => {
    if (shopping.length > 0 && Object.keys(prices).length === 0) loadPrices(false);
  }, [shopping.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const requiredItems = shopping.filter((i) => !i.optional);
  const optionalItems = shopping.filter((i) => i.optional);

  // Groupement par catégorie
  const grouped = useMemo(() => {
    const map = new Map<string, ShoppingItem[]>();
    requiredItems.forEach((it) => {
      const c = it.category ?? "pantry";
      const arr = map.get(c) ?? [];
      arr.push(it);
      map.set(c, arr);
    });
    return Array.from(map.entries());
  }, [requiredItems]);

  // Totaux par enseigne sur les articles requis
  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    RETAILERS.forEach((r) => (t[r.name] = 0));
    requiredItems.filter((i) => !i.checked).forEach((it) => {
      const p = prices[it.name];
      if (!p) return;
      RETAILERS.forEach((r) => {
        const rp = p.prices.find((x) => x.retailer === r.name);
        if (rp) t[r.name] += rp.price;
      });
    });
    return t;
  }, [requiredItems, prices]);

  const cheapest = useMemo(() => {
    const entries = Object.entries(totals).filter(([, v]) => v > 0);
    if (!entries.length) return null;
    return entries.reduce((a, b) => (a[1] < b[1] ? a : b))[0];
  }, [totals]);

  if (!plan) {
    return (
      <div className="px-5 py-20 text-center">
        <h2 className="font-bold text-lg">Pas encore de plan</h2>
        <p className="text-gray-500 text-sm mt-1">
          Générez un plan pour obtenir la liste de courses.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Liste de courses</h1>
          <p className="text-gray-600 text-sm mt-1">
            {requiredItems.length} à acheter · {optionalItems.length} optionnels
            {pricesLoading && " · Calcul des prix…"}
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-semibold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
          Régénérer
        </button>
      </div>

      {/* Comparateur */}
      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5" /> Comparateur du panier
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {RETAILERS.map((r) => {
            const total = totals[r.name];
            const isCheap = cheapest === r.name && total > 0;
            return (
              <a
                key={r.name}
                href={`${r.url}${encodeURIComponent(requiredItems.filter((i) => !i.checked).slice(0, 10).map((i) => i.name).join(" "))}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "p-3 rounded-2xl border bg-white relative transition active:scale-[0.98]",
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
                <div className="text-lg font-bold mt-0.5">{total > 0 ? `${total.toFixed(2)} €` : "·"}</div>
                <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  Commander <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2 mt-2">
          <p className="text-[11px] text-gray-400">Prix estimés. Variations possibles selon le magasin.</p>
          <button
            onClick={() => loadPrices(true)}
            disabled={pricesLoading}
            className="text-[11px] font-semibold text-primary disabled:opacity-50"
          >
            {pricesLoading ? "Affinage…" : "Affiner avec Open Prices"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {loading && shopping.length === 0 ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <div className="h-3 w-32 skeleton-shimmer rounded" />
              </div>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="p-3 flex items-center gap-3">
                  <div className="w-6 h-6 skeleton-shimmer rounded-md" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 skeleton-shimmer rounded" />
                    <div className="h-2.5 w-1/3 skeleton-shimmer rounded" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Articles requis groupés par catégorie */}
          <div className="mt-6 space-y-5">
            {grouped.map(([cat, items]) => (
              <CategoryBlock
                key={cat}
                category={cat}
                items={items}
                prices={prices}
                onToggle={toggleItem}
              />
            ))}
          </div>

          {/* Articles optionnels (placard / épices) */}
          {optionalItems.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-gray-500" />
                <h2 className="font-bold">À vérifier dans votre placard</h2>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Ces ingrédients sont souvent déjà chez vous. Cochez ce que vous avez à acheter.
              </p>
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 overflow-hidden">
                {optionalItems.map((it) => (
                  <OptionalRow key={it.id} item={it} onToggle={toggleItem} />
                ))}
              </div>
            </div>
          )}

          {/* Articles ajoutés depuis le catalogue */}
          {customItems.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛒</span>
                  <h2 className="font-bold">Ajouts hors recettes</h2>
                </div>
                <a href="/catalogue" className="text-xs font-semibold text-primary">+ Ajouter</a>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {customItems.map((it) => (
                  <div key={it.id} className="flex items-center gap-3 p-3">
                    <button
                      onClick={() => toggleCustomItem(it.id)}
                      className={cn(
                        "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0",
                        it.checked ? "bg-primary border-primary" : "border-gray-300"
                      )}
                    >
                      {it.checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                    </button>
                    <div className="text-2xl shrink-0">{it.emoji}</div>
                    <div className={cn("flex-1 min-w-0", it.checked && "line-through text-gray-400")}>
                      <div className="font-medium text-sm">{it.name}</div>
                      {it.unit && <div className="text-xs text-gray-500">{it.unit}</div>}
                    </div>
                    <button
                      onClick={() => removeCustomItem(it.id)}
                      className="shrink-0 text-xs text-gray-400 px-2"
                      aria-label="Retirer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CategoryBlock({
  category, items, prices, onToggle,
}: {
  category: string;
  items: ShoppingItem[];
  prices: Record<string, PricedIngredient>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 flex items-center gap-2 border-b border-gray-200">
        <span className="text-base">{CATEGORY_ICONS[category]}</span>
        <span className="text-xs uppercase tracking-wide text-gray-600 font-semibold">
          {CATEGORY_LABELS[category]}
        </span>
        <span className="text-[10px] text-gray-400 ml-auto">{items.length} articles</span>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((it) => (
          <ItemRow key={it.id} item={it} prices={prices[it.name]} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

function ItemRow({
  item, prices, onToggle,
}: {
  item: ShoppingItem;
  prices?: PricedIngredient;
  onToggle: (id: string) => void;
}) {
  const cheapestPrice = prices
    ? Math.min(...prices.prices.map((p) => p.price))
    : null;

  const hasLeftover = item.leftoverRatio !== undefined && item.leftoverRatio > 0.3;

  return (
    <div className="p-3">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(item.id)}
          className={cn(
            "w-6 h-6 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0",
            item.checked ? "bg-primary border-primary" : "border-gray-300"
          )}
        >
          {item.checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </button>
        <div className={cn("flex-1 min-w-0", item.checked && "line-through text-gray-400")}>
          <div className="font-medium text-sm capitalize">{item.name}</div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <Package className="w-3 h-3 shrink-0" />
            <span>{item.packSize?.label ?? `${item.amount} ${item.unit}`}</span>
            {hasLeftover && (
              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                Surplus prévu
              </span>
            )}
          </div>
          {prices && (
            <div className="grid grid-cols-4 gap-1 mt-2">
              {RETAILERS.map((r) => {
                const p = prices.prices.find((x) => x.retailer === r.name);
                const isMin = p && cheapestPrice !== null && p.price === cheapestPrice;
                return (
                  <div
                    key={r.name}
                    className={cn(
                      "px-1.5 py-1 rounded-md text-[10px] text-center",
                      isMin ? "bg-primary/10 text-primary font-bold" : "bg-gray-50 text-gray-600",
                      p?.source === "estimated" && "italic"
                    )}
                    title={p?.source === "estimated" ? "Prix estimé" : "Prix Open Prices"}
                  >
                    <div className="font-semibold truncate">{r.name.split(" ")[0]}</div>
                    <div>{p ? `${p.price.toFixed(2)}€` : "·"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionalRow({
  item, onToggle,
}: { item: ShoppingItem; onToggle: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <button
        onClick={() => onToggle(item.id)}
        className={cn(
          "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0",
          item.checked ? "bg-primary border-primary" : "border-gray-300"
        )}
      >
        {item.checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium capitalize">{item.name}</div>
        <div className="text-xs text-gray-500">
          {item.packSize?.label ?? `${item.amount} ${item.unit}`}
        </div>
      </div>
      <span className="text-[10px] text-gray-400">{CATEGORY_ICONS[item.category ?? "pantry"]}</span>
    </div>
  );
}

const RETAILER_NAMES = RETAILERS.map((r) => r.name);
export { RETAILER_NAMES };
