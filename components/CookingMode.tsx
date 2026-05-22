"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ChefHat, ChevronLeft, ChevronRight, Pause, Play, Timer, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  instructionsHtml?: string;
  ingredients?: { original: string; name: string }[];
  servings?: number;
}

// Découpe les instructions HTML en étapes <li> ou par phrases
function parseSteps(html: string): string[] {
  if (!html) return [];
  // 1. Essaie <li>
  const liMatches = Array.from(html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi));
  if (liMatches.length > 1) {
    return liMatches.map((m) => stripHtml(m[1]).trim()).filter(Boolean);
  }
  // 2. Strip et split sur phrases
  const text = stripHtml(html);
  return text.split(/(?<=[.!?])\s+(?=[A-ZÉÀ])/).map((s) => s.trim()).filter(Boolean);
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Détecte les minuteurs dans une étape (ex: "5 minutes", "1 heure", "30 secondes")
function detectTimer(step: string): number | null {
  const m = step.match(/(\d+)\s*(seconde|sec|minute|min|heure|h)s?/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  if (u.startsWith("sec")) return n;
  if (u.startsWith("min")) return n * 60;
  if (u.startsWith("h")) return n * 3600;
  return null;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function CookingMode({
  open, onClose, title, instructionsHtml, ingredients, servings,
}: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const steps = useMemo(
    () => parseSteps(instructionsHtml ?? ""),
    [instructionsHtml]
  );
  const currentStep = steps[stepIdx] ?? "";
  const detectedSeconds = useMemo(
    () => detectTimer(currentStep),
    [currentStep]
  );

  // Wake Lock pour empêcher l'écran de s'éteindre
  useEffect(() => {
    if (!open) return;
    const acquireLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        }
      } catch { /* user denied or unsupported */ }
    };
    acquireLock();
    return () => {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [open]);

  // Timer tick
  useEffect(() => {
    if (!timerRunning || timerLeft === null) return;
    if (timerLeft <= 0) {
      setTimerRunning(false);
      // Vibration + notification audio simple
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([200, 100, 200, 100, 200]);
      }
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 880;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        o.start(); o.stop(ctx.currentTime + 0.6);
      } catch { /* ignore */ }
      return;
    }
    const id = setTimeout(() => setTimerLeft((t) => (t ?? 0) - 1), 1000);
    return () => clearTimeout(id);
  }, [timerRunning, timerLeft]);

  // Reset timer quand on change d'étape
  useEffect(() => {
    setTimerLeft(detectedSeconds);
    setTimerRunning(false);
  }, [stepIdx, detectedSeconds]);

  if (!open) return null;

  const total = steps.length;
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === total - 1;

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950 text-white flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-5 py-4 flex items-center justify-between border-b border-white/10">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1 text-sm text-white/80"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center min-w-0">
          <div className="text-xs uppercase tracking-wide text-white/60 flex items-center justify-center gap-1">
            <ChefHat className="w-3.5 h-3.5" />
            Mode cuisine
          </div>
          <div className="font-bold text-sm truncate max-w-[200px]">{title}</div>
        </div>
        <div className="w-9 text-xs text-white/60 text-right">
          {stepIdx + 1}/{total}
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-emerald-400 transition-all duration-300"
          style={{ width: `${((stepIdx + 1) / total) * 100}%` }}
        />
      </div>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        {total === 0 ? (
          <p className="text-center text-white/70 mt-10">
            Aucune étape détectée pour cette recette.
          </p>
        ) : (
          <>
            <div className="text-sm text-emerald-400 font-bold uppercase tracking-wide mb-3">
              Étape {stepIdx + 1}
            </div>
            <p className="text-2xl md:text-3xl font-bold leading-tight">{currentStep}</p>

            {/* Timer si détecté */}
            {detectedSeconds !== null && (
              <div className="mt-8 p-5 rounded-3xl bg-white/10 backdrop-blur">
                <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                  <Timer className="w-4 h-4" />
                  Minuteur suggéré
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "text-5xl font-bold tabular-nums",
                    timerLeft === 0 && "text-amber-400 animate-pulse"
                  )}>
                    {formatTime(timerLeft ?? detectedSeconds)}
                  </div>
                  <button
                    onClick={() => {
                      if (timerLeft === null || timerLeft === 0) setTimerLeft(detectedSeconds);
                      setTimerRunning((r) => !r);
                    }}
                    className="ml-auto w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center"
                  >
                    {timerRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Ingrédients de l'étape (utile à droite, ici en bas) */}
            {stepIdx === 0 && ingredients && ingredients.length > 0 && (
              <div className="mt-8">
                <div className="text-xs uppercase tracking-wide text-white/60 mb-2">
                  Sortez vos ingrédients ({servings} pers.)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ingredients.map((ing, i) => (
                    <div key={i} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm">
                      {ing.original}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer navigation */}
      <footer className="shrink-0 p-4 border-t border-white/10 flex items-center gap-3 safe-bottom">
        <button
          onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center disabled:opacity-30"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        {isLast ? (
          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-500 font-bold"
          >
            Terminé 🎉
          </button>
        ) : (
          <button
            onClick={() => setStepIdx((i) => Math.min(total - 1, i + 1))}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-500 font-bold"
          >
            Étape suivante
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </footer>
    </div>
  );
}
