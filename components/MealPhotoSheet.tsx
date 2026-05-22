"use client";

import { useRef, useState } from "react";
import { Camera, Check, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyzedDish {
  dishName: string;
  estimatedServings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "low" | "medium" | "high";
  components: string[];
  note: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onLog?: (data: AnalyzedDish) => void;
}

export default function MealPhotoSheet({ open, onClose, onLog }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzedDish | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handleFile = (file: File) => {
    reset();
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      const mimeMatch = dataUrl.match(/data:(.*?);base64/);
      const mimeType = mimeMatch?.[1] || "image/jpeg";
      setAnalyzing(true);
      try {
        const res = await fetch("/api/analyze-meal-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec");
        setResult(data as AnalyzedDish);
      } catch (e) {
        setError(e instanceof Error ? e.message : "unknown");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg md:rounded-3xl bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl animate-slide-up">
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-lg">Mon plat en photo</h2>
          </div>
          <p className="text-sm text-gray-500">L'IA estime calories et macros depuis la photo.</p>

          {!preview && (
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-5 w-full bg-white border-2 border-dashed border-gray-300 rounded-3xl p-8 flex flex-col items-center gap-3 active:scale-[0.99]"
            >
              <Camera className="w-8 h-8 text-primary" />
              <div className="font-semibold">Prendre / choisir une photo</div>
              <p className="text-xs text-gray-500 text-center">Bien éclairé, dessus, plat entier visible.</p>
            </button>
          )}
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

          {preview && (
            <div className="mt-5">
              <div className="relative rounded-2xl overflow-hidden">
                <img src={preview} alt="plat" className="w-full max-h-64 object-cover" />
                {analyzing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyse en cours…
                    </div>
                  </div>
                )}
              </div>

              {result && (
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Détecté</div>
                    <div className="font-bold text-lg">{result.dishName}</div>
                    {result.note && (
                      <div className="text-sm text-gray-600 mt-1 flex items-start gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        {result.note}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <Stat label="Cal" value={`${result.calories}`} />
                    <Stat label="Prot" value={`${result.protein}g`} />
                    <Stat label="Glu" value={`${result.carbs}g`} />
                    <Stat label="Lip" value={`${result.fat}g`} />
                  </div>

                  {result.components.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Composants identifiés</div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.components.map((c) => (
                          <span key={c} className="text-xs px-2 py-1 bg-gray-100 rounded-full">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-1 inline-block",
                    result.confidence === "high" ? "bg-primary/10 text-primary" :
                    result.confidence === "medium" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-500"
                  )}>
                    Confiance {result.confidence}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={reset}
                      className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 text-sm font-semibold"
                    >
                      Recommencer
                    </button>
                    <button
                      onClick={() => {
                        onLog?.(result);
                        onClose();
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold"
                    >
                      <Check className="w-4 h-4" />
                      Logger ce plat
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
              )}
            </div>
          )}
        </div>

        <style jsx global>{`
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .animate-slide-up { animation: slideUp 0.25s ease-out; }
        `}</style>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="font-bold text-sm mt-0.5">{value}</div>
    </div>
  );
}
