"use client";

import { useMemo, useState } from "react";
import { Loader2, Package, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { PantryItem } from "@/lib/types";

const CATEGORY_EMOJI: Record<string, string> = {
  spice: "🌶️", pantry: "🥫", fresh: "🥬", cold: "🥩", frozen: "❄️",
};

const CATEGORY_LABEL: Record<string, string> = {
  spice: "Épices", pantry: "Placard", fresh: "Frais", cold: "Froid", frozen: "Surgelé",
};

// Suggestions de quick-add les plus communs
const QUICK_SUGGESTIONS: { name: string; emoji: string; category: PantryItem["category"] }[] = [
  { name: "Sel", emoji: "🧂", category: "spice" },
  { name: "Poivre", emoji: "🌶️", category: "spice" },
  { name: "Huile d'olive", emoji: "🫒", category: "pantry" },
  { name: "Huile végétale", emoji: "🛢️", category: "pantry" },
  { name: "Vinaigre", emoji: "🍶", category: "pantry" },
  { name: "Sucre", emoji: "🍬", category: "pantry" },
  { name: "Farine", emoji: "🌾", category: "pantry" },
  { name: "Riz", emoji: "🍚", category: "pantry" },
  { name: "Pâtes", emoji: "🍝", category: "pantry" },
  { name: "Ail", emoji: "🧄", category: "spice" },
  { name: "Beurre", emoji: "🧈", category: "cold" },
  { name: "Œufs", emoji: "🥚", category: "cold" },
  { name: "Lait", emoji: "🥛", category: "cold" },
  { name: "Moutarde", emoji: "🟡", category: "pantry" },
  { name: "Ketchup", emoji: "🍅", category: "pantry" },
  { name: "Mayonnaise", emoji: "🟨", category: "pantry" },
  { name: "Sauce soja", emoji: "🍶", category: "pantry" },
  { name: "Cumin", emoji: "🟤", category: "spice" },
  { name: "Paprika", emoji: "🟥", category: "spice" },
  { name: "Origan", emoji: "🌿", category: "spice" },
  { name: "Bouillon cube", emoji: "🧊", category: "pantry" },
];

export default function PantryPage() {
  const pantry = useStore((s) => s.pantry);
  const addItem = useStore((s) => s.addPantryItem);
  const removeItem = useStore((s) => s.removePantryItem);
  const hasHydrated = useStore((s) => s.hasHydrated);

  const [manual, setManual] = useState("");
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, PantryItem[]>();
    pantry.forEach((p) => {
      const c = p.category ?? "pantry";
      const arr = map.get(c) ?? [];
      arr.push(p);
      map.set(c, arr);
    });
    return Array.from(map.entries());
  }, [pantry]);

  const presentNames = useMemo(
    () => new Set(pantry.map((p) => p.name.toLowerCase())),
    [pantry]
  );

  const filteredSuggestions = useMemo(() => {
    return QUICK_SUGGESTIONS.filter((s) => {
      if (presentNames.has(s.name.toLowerCase())) return false;
      if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [presentNames, query]);

  const addManual = () => {
    const name = manual.trim();
    if (!name) return;
    addItem({ name, category: "pantry", emoji: "📦" });
    setManual("");
  };

  if (!hasHydrated) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mon garde-manger</h1>
          <p className="text-sm text-gray-500">
            Ce que vous avez déjà chez vous, pour ne plus l'acheter en double.
          </p>
        </div>
      </div>

      {/* Ajout manuel */}
      <div className="mt-5 flex gap-2">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addManual()}
          placeholder="Ajouter (ex: tahini, noix de muscade)"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm"
        />
        <button
          onClick={addManual}
          className="px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Suggestions rapides */}
      {filteredSuggestions.length > 0 && (
        <div className="mt-6">
          <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2 flex items-center justify-between">
            <span>Suggestions rapides</span>
            {query && (
              <button onClick={() => setQuery("")} className="text-primary normal-case font-normal">
                tout
              </button>
            )}
          </div>
          <div className="mb-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer…"
              className="w-full pl-10 pr-3 py-2 rounded-full bg-gray-100 text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredSuggestions.map((s) => (
              <button
                key={s.name}
                onClick={() => addItem({ name: s.name, emoji: s.emoji, category: s.category })}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium"
              >
                <span>{s.emoji}</span>
                {s.name}
                <Plus className="w-3.5 h-3.5 text-primary" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mon stock */}
      {pantry.length > 0 ? (
        <div className="mt-6 space-y-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
            J'ai {pantry.length} ingrédient{pantry.length > 1 ? "s" : ""} chez moi
          </div>
          {grouped.map(([cat, items]) => (
            <div key={cat} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 text-xs uppercase tracking-wide text-gray-600 font-semibold flex items-center gap-2 border-b border-gray-200">
                <span>{CATEGORY_EMOJI[cat]}</span>
                {CATEGORY_LABEL[cat]}
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center gap-3 p-3">
                    <span className="text-xl shrink-0">{it.emoji ?? "📦"}</span>
                    <span className="flex-1 text-sm capitalize">{it.name}</span>
                    <button
                      onClick={() => removeItem(it.id)}
                      className="shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center active:scale-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-center py-10 px-4 rounded-2xl bg-white border border-dashed border-gray-300">
          <div className="text-5xl mb-2">🥫</div>
          <p className="font-semibold">Votre garde-manger est vide</p>
          <p className="text-sm text-gray-500 mt-1">
            Cochez ce que vous avez déjà pour ne plus l'acheter.
          </p>
        </div>
      )}

      <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/20 text-sm text-gray-700">
        <div className="font-semibold text-primary mb-1">À quoi ça sert ?</div>
        <p>
          Vos ingrédients ici sont automatiquement <strong>retirés de la liste de courses</strong>
          quand vous générez un plan. Plus de "j'ai déjà du sel acheté 5 fois ce mois".
        </p>
      </div>
    </div>
  );
}
