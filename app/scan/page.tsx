"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera, Check, Loader2, Plus, ScanLine, X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Product {
  found: boolean;
  name: string;
  brand: string | null;
  image: string | null;
  nutriscore: string | null;
  novaGroup: number | null;
  ecoscore: string | null;
  quantity: string | null;
  nutrition: {
    calories: number; protein: number; carbs: number; fat: number; sugars: number; salt: number;
  };
}

declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats: string[] }) => BarcodeDetector;
  }
  interface BarcodeDetector {
    detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
  }
}

export default function ScanPage() {
  const addCustomItem = useStore((s) => s.addCustomItem);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [code, setCode] = useState<string>("");
  const [manual, setManual] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported(!!window.BarcodeDetector);
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      if (!window.BarcodeDetector) throw new Error("Scanner natif non supporté ici, utilisez le mode manuel.");
      detectorRef.current = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      tick();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Caméra refusée");
    }
  };

  const stopCamera = () => {
    const stream = (videoRef.current?.srcObject as MediaStream | null);
    stream?.getTracks().forEach((t) => t.stop());
    setStreaming(false);
  };

  const tick = async () => {
    if (!videoRef.current || !detectorRef.current) return;
    try {
      const codes = await detectorRef.current.detect(videoRef.current);
      if (codes.length > 0) {
        const found = codes[0].rawValue;
        setCode(found);
        stopCamera();
        lookup(found);
        return;
      }
    } catch { /* skip frame */ }
    requestAnimationFrame(tick);
  };

  const lookup = async (c: string) => {
    setLoading(true);
    setError(null);
    setProduct(null);
    try {
      const res = await fetch(`/api/barcode?code=${encodeURIComponent(c)}`);
      const data = await res.json();
      if (!res.ok && res.status !== 404) throw new Error(data.error || "Échec");
      if (data.found) setProduct(data as Product);
      else setError("Produit inconnu dans Open Food Facts.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (g: string | null) => {
    if (!g) return "bg-gray-300 text-gray-700";
    return {
      A: "bg-emerald-500 text-white",
      B: "bg-lime-500 text-white",
      C: "bg-yellow-500 text-white",
      D: "bg-orange-500 text-white",
      E: "bg-red-600 text-white",
    }[g] ?? "bg-gray-300 text-gray-700";
  };

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
          <ScanLine className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Scan code-barre</h1>
          <p className="text-sm text-gray-500">Identifie un produit, voir sa fiche Open Food Facts.</p>
        </div>
      </div>

      {!streaming && !product && (
        <div className="mt-6 space-y-3">
          <button
            onClick={startCamera}
            disabled={supported === false}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-zinc-900 text-white font-bold disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            Scanner avec la caméra
          </button>
          {supported === false && (
            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-xl">
              Le scanner natif n'est pas supporté sur ce navigateur. Utilisez Chrome Android ou la saisie manuelle.
            </p>
          )}
          <div className="text-center text-xs text-gray-400">ou</div>
          <div className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Saisir un code-barre (EAN-13)"
              inputMode="numeric"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm"
            />
            <button
              onClick={() => manual && lookup(manual)}
              disabled={!manual.trim() || loading}
              className="px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Chercher"}
            </button>
          </div>
        </div>
      )}

      {streaming && (
        <div className="mt-6 relative rounded-3xl overflow-hidden bg-black aspect-[3/4]">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-3/4 h-1/3 border-2 border-emerald-400 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.5)]" />
          </div>
          <button
            onClick={stopCamera}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 inset-x-0 text-center text-white text-sm">
            Visez le code-barre…
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {product && (
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl bg-white border border-gray-200 p-4">
            <div className="flex gap-3">
              {product.image && (
                <img src={product.image} alt={product.name} className="w-24 h-24 rounded-2xl object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase tracking-wide text-gray-500">{product.brand}</div>
                <div className="font-bold text-lg leading-tight">{product.name}</div>
                {product.quantity && <div className="text-xs text-gray-500 mt-0.5">{product.quantity}</div>}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              {product.nutriscore && (
                <div className={cn("px-2.5 py-1 rounded-lg text-xs font-bold", scoreColor(product.nutriscore))}>
                  Nutri-Score {product.nutriscore}
                </div>
              )}
              {product.novaGroup && (
                <div className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold",
                  product.novaGroup === 1 ? "bg-emerald-100 text-emerald-700" :
                  product.novaGroup === 2 ? "bg-yellow-100 text-yellow-700" :
                  product.novaGroup === 3 ? "bg-orange-100 text-orange-700" :
                  "bg-red-100 text-red-700"
                )}>
                  NOVA {product.novaGroup}
                </div>
              )}
              {product.ecoscore && (
                <div className={cn("px-2.5 py-1 rounded-lg text-xs font-bold", scoreColor(product.ecoscore))}>
                  Eco-Score {product.ecoscore}
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              <Macro label="Cal" value={`${product.nutrition.calories}`} unit="kcal/100g" />
              <Macro label="Prot" value={`${product.nutrition.protein}`} unit="g" />
              <Macro label="Glu" value={`${product.nutrition.carbs}`} unit="g" />
              <Macro label="Lip" value={`${product.nutrition.fat}`} unit="g" />
            </div>
            {(product.nutrition.sugars > 10 || product.nutrition.salt > 1.5) && (
              <div className="mt-3 p-2 rounded-lg bg-amber-50 text-xs text-amber-800">
                ⚠️ Attention :{" "}
                {product.nutrition.sugars > 10 && `${product.nutrition.sugars}g de sucres / 100g`}
                {product.nutrition.sugars > 10 && product.nutrition.salt > 1.5 && " · "}
                {product.nutrition.salt > 1.5 && `${product.nutrition.salt}g de sel / 100g`}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              addCustomItem({
                name: product.name,
                category: "other",
                emoji: "📦",
                quantity: 1,
                unit: product.quantity || undefined,
                checked: false,
              });
              setProduct(null);
              setCode("");
              setManual("");
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-primary text-white font-bold"
          >
            <Plus className="w-4 h-4" />
            Ajouter au panier
          </button>
          <button
            onClick={() => { setProduct(null); setCode(""); setManual(""); }}
            className="w-full py-2 text-sm font-semibold text-gray-500"
          >
            Scanner un autre produit
          </button>
        </div>
      )}
    </div>
  );
}

function Macro({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="font-bold text-base">{value}</div>
      <div className="text-[10px] text-gray-400">{unit}</div>
    </div>
  );
}
