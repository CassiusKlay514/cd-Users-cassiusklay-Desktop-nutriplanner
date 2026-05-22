"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Camera, Check, Loader2, Sparkles, Upload, X,
} from "lucide-react";
import { addDays } from "date-fns";
import { useStore } from "@/lib/store";
import { cn, isoDate } from "@/lib/utils";
import type { MealPlan } from "@/lib/types";

interface DetectedIngredient {
  name: string;
  category: "fresh" | "cold" | "pantry" | "frozen";
  confidence: number;
  notes?: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  fresh: "🥬", cold: "🥩", pantry: "🥫", frozen: "❄️",
};

const CATEGORY_LABEL: Record<string, string> = {
  fresh: "Frais", cold: "Froid", pantry: "Placard", frozen: "Surgelé",
};

export default function FridgePage() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const setPlan = useStore((s) => s.setPlan);

  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<DetectedIngredient[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [manual, setManual] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setIngredients([]);
    setSummary("");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      const mimeMatch = dataUrl.match(/data:(.*?);base64/);
      const mimeType = mimeMatch?.[1] || "image/jpeg";
      setAnalyzing(true);
      try {
        const res = await fetch("/api/analyze-fridge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec");
        setIngredients(data.ingredients ?? []);
        setSummary(data.summary ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "unknown");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleExcluded = (name: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addManual = () => {
    const items = manual.split(",").map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    setIngredients((prev) => [
      ...prev,
      ...items.map((name) => ({ name, category: "fresh" as const, confidence: 1 })),
    ]);
    setManual("");
  };

  const selected = ingredients.filter((i) => !excluded.has(i.name));

  const generate = async () => {
    if (!profile) {
      router.push("/onboarding");
      return;
    }
    if (!selected.length) {
      setError("Sélectionnez au moins 1 ingrédient");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          startDate: isoDate(start),
          endDate: isoDate(addDays(start, 6)),
          availableIngredients: selected.map((i) => i.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setPlan(data.plan as MealPlan);
      router.push("/plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-3xl mx-auto pb-28">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Photo de mon frigo</h1>
        </div>
      </div>
      <p className="text-gray-600 text-sm">
        L'IA reconnaît ce que vous avez et bâtit un plan pour l'utiliser. Anti-gaspillage garanti.
      </p>

      {/* Upload zone */}
      {!preview && (
        <div className="mt-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full bg-white border-2 border-dashed border-gray-300 rounded-3xl p-10 flex flex-col items-center gap-3 active:scale-[0.99] transition"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div className="font-semibold">Prendre ou choisir une photo</div>
            <p className="text-sm text-gray-500 text-center max-w-xs">
              Ouvrez votre frigo en grand, prenez une photo nette. JPG ou PNG.
            </p>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {/* Preview + result */}
      {preview && (
        <div className="mt-6">
          <div className="relative rounded-3xl overflow-hidden bg-black/5">
            <img src={preview} alt="frigo" className="w-full max-h-72 object-cover" />
            <button
              onClick={() => {
                setPreview(null);
                setIngredients([]);
                setSummary("");
                setExcluded(new Set());
              }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            {analyzing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyse en cours…
                </div>
              </div>
            )}
          </div>

          {summary && (
            <div className="mt-4 p-3 rounded-2xl bg-primary/5 border border-primary/20 text-sm flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-gray-700">{summary}</p>
            </div>
          )}

          {ingredients.length > 0 && (
            <>
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold">
                    Détecté ({selected.length}/{ingredients.length})
                  </h2>
                  <span className="text-xs text-gray-500">Cliquez pour retirer</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing) => {
                    const isExcluded = excluded.has(ing.name);
                    return (
                      <button
                        key={ing.name}
                        onClick={() => toggleExcluded(ing.name)}
                        className={cn(
                          "px-3 py-2 rounded-full text-sm font-medium border flex items-center gap-1.5",
                          isExcluded
                            ? "bg-gray-100 border-gray-200 text-gray-400 line-through"
                            : "bg-white border-gray-200 text-gray-700"
                        )}
                      >
                        <span>{CATEGORY_EMOJI[ing.category] ?? "🥄"}</span>
                        {ing.name}
                        {ing.confidence < 0.6 && !isExcluded && (
                          <span className="text-[10px] text-gray-400">?</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ajout manuel */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ajouter manuellement
                </label>
                <div className="flex gap-2">
                  <input
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                    placeholder="ex: pâtes, riz, parmesan"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm"
                    onKeyDown={(e) => e.key === "Enter" && addManual()}
                  />
                  <button
                    onClick={addManual}
                    className="px-4 py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
          )}
        </div>
      )}

      {/* Bottom CTA */}
      {ingredients.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-5 right-5 max-w-md mx-auto z-30">
          <button
            onClick={generate}
            disabled={generating || !selected.length}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-primary text-white font-bold shadow-xl shadow-primary/30 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                Générer mon plan ({selected.length} ingrédients)
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
